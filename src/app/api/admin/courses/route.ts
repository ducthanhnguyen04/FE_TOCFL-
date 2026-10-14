import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Xác thực quyền Admin nghiêm ngặt trên Server
async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Vui lòng đăng nhập.', status: 401 };
  }

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

// 1. GET: Lấy toàn bộ Bộ giáo trình kèm sách con và số bài học
export async function GET() {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  const { data, error } = await supabase
    .from('book_series')
    .select('*, books(*, lessons(count))')
    .order('orderindex', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sắp xếp các cuốn sách trong từng bộ theo tên
  const sortedData = (data || []).map((series: any) => {
    if (series.books) {
      series.books.sort((a: any, b: any) => a.bookName.localeCompare(b.bookName));
    }
    return series;
  });

  return NextResponse.json({ series: sortedData });
}

// 2. POST: Thêm mới hoặc Cập nhật Bộ giáo trình / Cuốn sách
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;

  try {
    const body = await req.json();
    const { action, id, name, description, orderindex, bookName, bookSeriId } = body;

    // A. Tạo Bộ giáo trình mới
    if (action === 'create_series') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Tên bộ giáo trình không được để trống' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('book_series')
        .insert({
          name: name.trim(),
          description: description?.trim() || '',
          orderindex: Number(orderindex) || 1
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, series: data });
    }

    // B. Sửa Bộ giáo trình
    if (action === 'update_series') {
      if (!id) {
        return NextResponse.json({ error: 'Thiếu ID bộ giáo trình' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('book_series')
        .update({
          name: name?.trim(),
          description: description?.trim() || '',
          orderindex: Number(orderindex) || 1,
          updatedat: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, series: data });
    }

    // C. Thêm Cuốn sách vào Bộ giáo trình
    if (action === 'create_book') {
      if (!bookName || !bookName.trim()) {
        return NextResponse.json({ error: 'Tên cuốn sách không được để trống' }, { status: 400 });
      }
      if (!bookSeriId) {
        return NextResponse.json({ error: 'Thiếu bookSeriId' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('books')
        .insert({
          bookName: bookName.trim(),
          bookSeriId: bookSeriId
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, book: data });
    }

    // D. Sửa tên Cuốn sách
    if (action === 'update_book') {
      if (!id) {
        return NextResponse.json({ error: 'Thiếu ID cuốn sách' }, { status: 400 });
      }
      if (!bookName || !bookName.trim()) {
        return NextResponse.json({ error: 'Tên cuốn sách không được để trống' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('books')
        .update({
          bookName: bookName.trim(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, book: data });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý server' }, { status: 500 });
  }
}

// 3. DELETE: Xóa Bộ giáo trình hoặc Cuốn sách
export async function DELETE(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // 'series' hoặc 'book'

  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID cần xóa' }, { status: 400 });
  }

  try {
    if (type === 'book') {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Đã xóa cuốn sách thành công' });
    } else {
      // Mặc định là xóa bộ giáo trình
      const { error } = await supabase
        .from('book_series')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Đã xóa bộ giáo trình thành công' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Không thể xóa dữ liệu này' }, { status: 500 });
  }
}
