import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Hàm xác thực quyền Admin nghiêm ngặt trên Server
async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Vui lòng đăng nhập.', status: 401 };
  }

  // Tra cứu role trực tiếp từ database trên server
  let role: string | null = (user.user_metadata?.role || user.app_metadata?.role) as string | null;

  if (!role) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role) {
      role = profile.role;
    }
  }

  if (!role && user.email) {
    const { data: profileEmail } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();

    if (profileEmail?.role) {
      role = profileEmail.role;
    }
  }

  if (role !== 'admin') {
    return { error: 'Forbidden. Chỉ quản trị viên mới có quyền thao tác!', status: 403 };
  }

  return { user, supabase };
}

// 1. GET: Lấy danh sách toàn bộ bài học (Lessons) kèm thông tin Sách & Bộ giáo trình
export async function GET(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  const { searchParams } = new URL(req.url);
  const bookIdParam = searchParams.get('bookId');

  try {
    // 1. Truy vấn danh sách bài học
    let query = supabase
      .from('lessons')
      .select('*, books(id, bookName, bookSeriId, book_series(id, name)), vocabularies(count)')
      .order('createdAt', { ascending: true });

    if (bookIdParam) {
      query = query.eq('bookId', bookIdParam);
    }

    const { data: lessons, error: lessonsError } = await query;
    if (lessonsError) throw lessonsError;

    // 2. Truy vấn danh sách sách (books) để đưa vào dropdown lựa chọn
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, bookName, bookSeriId, book_series(id, name)')
      .order('bookName', { ascending: true });

    if (booksError) throw booksError;

    // 3. Truy vấn danh sách bộ giáo trình (book_series)
    const { data: series, error: seriesError } = await supabase
      .from('book_series')
      .select('id, name, orderindex')
      .order('orderindex', { ascending: true });

    if (seriesError) throw seriesError;

    return NextResponse.json({
      lessons: lessons || [],
      books: books || [],
      series: series || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tải dữ liệu bài học' }, { status: 500 });
  }
}

// 2. POST: Thêm mới, Cập nhật hoặc Đổi trạng thái khóa bài học
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;

  try {
    const body = await req.json();
    const { action, id, lessonName, bookId, wordCount, isLocked } = body;

    // A. Tạo bài học mới
    if (action === 'create_lesson') {
      if (!lessonName || !lessonName.trim()) {
        return NextResponse.json({ error: 'Tên bài học không được để trống' }, { status: 400 });
      }
      if (!bookId) {
        return NextResponse.json({ error: 'Vui lòng chọn cuốn sách cho bài học này' }, { status: 400 });
      }

      // Thử gọi RPC admin_create_lesson nếu có
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_create_lesson', {
        p_lesson_name: lessonName.trim(),
        p_book_id: bookId,
        p_is_locked: Boolean(isLocked)
      });

      if (!rpcError && rpcData) {
        return NextResponse.json({ success: true, lesson: rpcData });
      }

      // Fallback insert trực tiếp
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          lessonName: lessonName.trim(),
          bookId: bookId,
          wordCount: Number(wordCount) || 0,
          isLocked: Boolean(isLocked)
        })
        .select('*, books(id, bookName, bookSeriId, book_series(id, name)), vocabularies(count)')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, lesson: data });
    }

    // B. Cập nhật bài học
    if (action === 'update_lesson') {
      if (!id) {
        return NextResponse.json({ error: 'Thiếu ID bài học cần sửa' }, { status: 400 });
      }
      if (!lessonName || !lessonName.trim()) {
        return NextResponse.json({ error: 'Tên bài học không được để trống' }, { status: 400 });
      }
      if (!bookId) {
        return NextResponse.json({ error: 'Vui lòng chọn cuốn sách cho bài học' }, { status: 400 });
      }

      // Thử gọi RPC admin_update_lesson nếu có
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_lesson', {
        p_lesson_id: id,
        p_lesson_name: lessonName.trim(),
        p_book_id: bookId,
        p_is_locked: Boolean(isLocked)
      });

      if (!rpcError && rpcData) {
        return NextResponse.json({ success: true, lesson: rpcData });
      }

      // Fallback update trực tiếp
      const { data, error } = await supabase
        .from('lessons')
        .update({
          lessonName: lessonName.trim(),
          bookId: bookId,
          isLocked: Boolean(isLocked),
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select('*, books(id, bookName, bookSeriId, book_series(id, name)), vocabularies(count)')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, lesson: data });
    }

    // C. Bật/Tắt khóa bài học nhanh (Fast toggle isLocked)
    if (action === 'toggle_lock') {
      if (!id) {
        return NextResponse.json({ error: 'Thiếu ID bài học' }, { status: 400 });
      }

      const nextLockState = Boolean(isLocked);

      // Thử gọi RPC admin_toggle_lesson_lock nếu có
      const { error: rpcError } = await supabase.rpc('admin_toggle_lesson_lock', {
        p_lesson_id: id,
        p_is_locked: nextLockState
      });

      if (!rpcError) {
        return NextResponse.json({ success: true, isLocked: nextLockState });
      }

      // Fallback update trực tiếp
      const { data, error } = await supabase
        .from('lessons')
        .update({
          isLocked: nextLockState,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Không thể cập nhật trạng thái khóa bài học. Vui lòng kiểm tra quyền trên Supabase.');
      }

      return NextResponse.json({ success: true, isLocked: nextLockState });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý server' }, { status: 500 });
  }
}

// 3. DELETE: Xóa bài học
export async function DELETE(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID bài học cần xóa' }, { status: 400 });
  }

  try {
    // 1. Thử gọi RPC admin_delete_lesson nếu có
    const { error: rpcError } = await supabase.rpc('admin_delete_lesson', {
      p_lesson_id: id
    });

    if (!rpcError) {
      return NextResponse.json({ success: true, message: 'Đã xóa bài học thành công' });
    }

    // 2. Fallback xóa trực tiếp
    const { data, error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Không thể xóa bài học (0 dòng bị xóa). Vui lòng kiểm tra quyền trên Supabase.');
    }

    return NextResponse.json({ success: true, message: 'Đã xóa bài học thành công' });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || 'Không thể xóa bài học này (có thể do ràng buộc từ vựng liên quan)'
    }, { status: 500 });
  }
}
