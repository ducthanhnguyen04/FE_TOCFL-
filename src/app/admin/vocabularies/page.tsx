import type { Metadata } from 'next';
import ClientPage from '../../ClientPage';

export const metadata: Metadata = {
  title: 'Quản lý Từ Vựng (Vocabularies) | Nhai TOCFL Admin',
  description: 'Trang quản trị từ vựng Hán tự, phiên âm Pinyin, giải nghĩa và nhập hàng loạt từ JSON cho Nhai TOCFL.'
};

export default function AdminVocabulariesPage() {
  return <ClientPage initialActiveMenuId="admin-vocabularies" />;
}
