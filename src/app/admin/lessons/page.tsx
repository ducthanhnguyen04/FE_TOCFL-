import type { Metadata } from 'next';
import ClientPage from '../../ClientPage';

export const metadata: Metadata = {
  title: 'Quản lý Bài Học (Lessons) | Nhai TOCFL Admin',
  description: 'Trang quản trị các bài học, phân quyền VIP/Miễn phí và liên kết giáo trình cho Nhai TOCFL.'
};

export default function AdminLessonsPage() {
  return <ClientPage initialActiveMenuId="admin-lessons" />;
}
