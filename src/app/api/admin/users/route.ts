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
    return { error: 'Forbidden. Bạn không có quyền truy cập khu vực này!', status: 403 };
  }

  return { user, supabase };
}

// 1. GET: Lấy danh sách toàn bộ người dùng (Chỉ Admin mới lấy được)
export async function GET() {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;

  // 1. Thử gọi hàm RPC bảo mật get_all_users_for_admin (bỏ qua RLS recursion)
  const { data: rpcUsers, error: rpcError } = await supabase.rpc('get_all_users_for_admin');
  if (!rpcError && rpcUsers && Array.isArray(rpcUsers) && rpcUsers.length > 0) {
    return NextResponse.json({ users: rpcUsers });
  }

  // 2. Fallback query trực tiếp từ bảng users
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

// 2. POST: Cập nhật role, gói Premium hoặc sửa thông tin (Chỉ Admin mới gọi được)
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase } = authCheck;
  try {
    const body = await req.json();
    const { action, targetUserId, userName, email, role, isPremium } = body;

    if (!targetUserId && action !== 'create') {
      return NextResponse.json({ error: 'Thiếu targetUserId' }, { status: 400 });
    }

    if (action === 'update_role') {
      if (role !== 'admin' && role !== 'user') {
        return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
      }
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Đã cập nhật vai trò' });
    }

    if (action === 'update_premium') {
      const { error } = await supabase
        .from('users')
        .update({ isPremium: Boolean(isPremium) })
        .eq('id', targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Đã cập nhật trạng thái Premium' });
    }

    if (action === 'update_info') {
      const { error } = await supabase
        .from('users')
        .update({
          userName,
          email,
          role,
          isPremium: Boolean(isPremium)
        })
        .eq('id', targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Đã cập nhật thông tin người dùng' });
    }

    if (action === 'create') {
      const { error } = await supabase
        .from('users')
        .insert({
          id: targetUserId || `user-${Date.now()}`,
          userName,
          email,
          role: role || 'user',
          isPremium: Boolean(isPremium)
        });

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Đã thêm người dùng mới' });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý server' }, { status: 500 });
  }
}

// 3. DELETE: Xoá người dùng (Chỉ Admin mới xoá được)
export async function DELETE(req: NextRequest) {
  const authCheck = await verifyAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { supabase, user: currentAdmin } = authCheck;
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu id người dùng cần xoá' }, { status: 400 });
    }

    // Không cho phép tự xoá chính mình
    if (userId === currentAdmin.id) {
      return NextResponse.json({ error: 'Không thể tự xoá tài khoản Admin của chính mình!' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Đã xoá người dùng thành công' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi xoá người dùng' }, { status: 500 });
  }
}
