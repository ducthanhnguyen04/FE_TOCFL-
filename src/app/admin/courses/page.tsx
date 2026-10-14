import type { Metadata } from 'next';
import ClientPage from '../../ClientPage';

export const metadata: Metadata = {
  title: 'Quản lý Giáo Trình | Nhai TOCFL Admin',
  description: 'Trang quản trị các bộ giáo trình, phân chia cấp độ sách và cấu trúc bài học cho Nhai TOCFL.'
};

export default function AdminCoursesPage() {
  return <ClientPage initialActiveMenuId="admin-courses" />;
}
