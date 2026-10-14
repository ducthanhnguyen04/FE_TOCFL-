import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Nếu chưa đăng nhập, lập tức redirect về trang chủ (chặn hoàn toàn truy cập URL)
  if (!user) {
    redirect('/');
  }

  // 2. Kiểm tra vai trò trong cơ sở dữ liệu trên server
  let role: string | null = (user.user_metadata?.role || user.app_metadata?.role) as string | null;

  if (!role) {
    // 2a. Tra cứu theo auth user id
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
    // 2b. Fallback tra cứu theo email
    const { data: profileEmail } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();

    if (profileEmail?.role) {
      role = profileEmail.role;
    }
  }

  // 3. Nếu không phải role admin, chặn và đẩy về trang chủ ngay từ phía server
  if (role !== 'admin') {
    redirect('/');
  }

  return <>{children}</>;
}
