import { MenuItem } from '@/types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'home',
    label: 'Trang chủ',
    iconName: 'Home',
    isActive: true,
  },
  {
    id: 'platform',
    label: 'Nền tảng',
    iconName: 'LayoutGrid',
    hasSubmenu: true,
    subItems: [
      { id: 'pinyin', label: 'Bảng Pinyin', iconName: 'AudioLines', badge: 'học kỹ x 99' },
      { id: 'radicals', label: '214 Bộ Thủ', iconName: 'BookMarked' },
      { id: 'rules', label: 'Quy tắc chuyển âm', iconName: 'ArrowRightLeft' },
    ],
  },
  {
    id: 'personalize',
    label: 'Cá nhân hoá',
    iconName: 'UserCheck',
    hasSubmenu: true,
    subItems: [
      { id: 'route', label: 'Lộ trình', iconName: 'Route' },
      { id: 'review', label: 'Ôn tập', iconName: 'RefreshCw' },
      { id: 'vocab', label: 'Sổ tay từ vựng', iconName: 'NotebookPen' },
      { id: 'grammar', label: 'Sổ tay ngữ pháp', iconName: 'Library' },
      { id: 'progress', label: 'Tiến độ học', iconName: 'BarChart2' },
    ],
  },
  {
    id: 'dictionary',
    label: 'Tra từ điển',
    iconName: 'BookA',
    hasSubmenu: true,
    subItems: [
      { id: 'dict-search', label: 'Tra từ điển', iconName: 'BookA' },
      { id: 'character-analysis', label: 'Phân tích Hán tự', iconName: 'ScanSearch' },
    ],
  },
  {
    id: 'shadowing',
    label: 'Shadowing',
    iconName: 'Mic',
  },
  {
    id: 'lessons',
    label: 'Bài khoá',
    iconName: 'BookOpen',
  },
  {
    id: 'certificates',
    label: 'Luyện thi chứng chỉ',
    iconName: 'GraduationCap',
  },
  {
    id: 'create-file',
    label: 'Tạo file',
    iconName: 'FileText',
  },
  {
    id: 'leaderboard',
    label: 'Bảng xếp hạng',
    iconName: 'Trophy',
  },
  {
    id: 'feedback',
    label: 'Phản hồi',
    iconName: 'MessageSquareText',
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    iconName: 'Settings',
  },
];
