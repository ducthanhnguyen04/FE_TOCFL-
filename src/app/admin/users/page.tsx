import type { Metadata } from 'next';
import ClientPage from '../../ClientPage';

export const metadata: Metadata = {
  title: 'Quản lý Người Dùng | Nhai TOCFL Admin',
  description: 'Trang quản trị người dùng, phân quyền Admin và quản lý tài khoản cho Nhai TOCFL.'
};

export default function AdminUsersPage() {
  return <ClientPage initialActiveMenuId="admin-users" />;
}
