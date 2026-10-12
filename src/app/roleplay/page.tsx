import type { Metadata } from 'next';
import ClientPage from '../ClientPage';

export const metadata: Metadata = {
  title: 'Hội thoại nhập vai AI | Nhai TOCFL',
  description: 'Luyện nói tiếng Trung Đài Loan với gia sư AI nhập vai theo chủ đề, sửa lỗi và gợi ý câu trả lời.'
};

export default function RoleplayPage() {
  return <ClientPage initialActiveMenuId="roleplay" />;
}
