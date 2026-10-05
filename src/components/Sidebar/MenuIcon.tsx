import React from 'react';
import {
  Home,
  LayoutGrid,
  UserCheck,
  BookA,
  Mic,
  BookOpen,
  GraduationCap,
  FileText,
  Trophy,
  MessageSquareText,
  Settings,
  Route,
  RefreshCw,
  NotebookPen,
  Library,
  BarChart2,
  AudioLines,
  BookMarked,
  ArrowRightLeft,
  ScanSearch,
} from 'lucide-react';

interface MenuIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const MenuIcon: React.FC<MenuIconProps> = ({ name, className, size = 20 }) => {
  switch (name) {
    case 'Home':
      return <Home size={size} className={className} />;
    case 'LayoutGrid':
      return <LayoutGrid size={size} className={className} />;
    case 'UserCheck':
      return <UserCheck size={size} className={className} />;
    case 'BookA':
      return <BookA size={size} className={className} />;
    case 'Mic':
      return <Mic size={size} className={className} />;
    case 'BookOpen':
      return <BookOpen size={size} className={className} />;
    case 'GraduationCap':
      return <GraduationCap size={size} className={className} />;
    case 'FileText':
      return <FileText size={size} className={className} />;
    case 'Trophy':
      return <Trophy size={size} className={className} />;
    case 'MessageSquareText':
      return <MessageSquareText size={size} className={className} />;
    case 'Settings':
      return <Settings size={size} className={className} />;
    case 'Route':
      return <Route size={size} className={className} />;
    case 'RefreshCw':
      return <RefreshCw size={size} className={className} />;
    case 'NotebookPen':
      return <NotebookPen size={size} className={className} />;
    case 'Library':
      return <Library size={size} className={className} />;
    case 'BarChart2':
      return <BarChart2 size={size} className={className} />;
    case 'AudioLines':
      return <AudioLines size={size} className={className} />;
    case 'BookMarked':
      return <BookMarked size={size} className={className} />;
    case 'ArrowRightLeft':
      return <ArrowRightLeft size={size} className={className} />;
    case 'ScanSearch':
      return <ScanSearch size={size} className={className} />;
    default:
      return <Home size={size} className={className} />;
  }
};
