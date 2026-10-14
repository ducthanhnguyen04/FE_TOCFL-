import type { Metadata } from 'next';
import ClientPage from '../ClientPage';

export const metadata: Metadata = {
  title: 'Khu Vực Quản Trị | Nhai TOCFL Admin',
  description: 'Trang quản trị cho Nhai TOCFL.'
};

export default function AdminPage() {
  return <ClientPage initialActiveMenuId="admin-users" />;
}
