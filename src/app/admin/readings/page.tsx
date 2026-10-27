import type { Metadata } from 'next';
import ClientPage from '../../ClientPage';

export const metadata: Metadata = {
  title: 'Quản lý Đọc Hiểu (Readings) | Nhai TOCFL Admin',
  description: 'Trang quản trị câu hỏi bài tập đọc hiểu, phiên âm Pinyin, đáp án đúng và nhập hàng loạt từ JSON cho Nhai TOCFL.'
};

export default function AdminReadingsPage() {
  return <ClientPage initialActiveMenuId="admin-readings" />;
}
