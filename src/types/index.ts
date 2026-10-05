export interface HSKLevelItem {
  id: number;
  title: string;
  level: number;
  wordCount: number;
  patternCount?: number;
  grammarPoints?: number;
  description?: string;
  isComingSoon?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  iconName: string;
  hasSubmenu?: boolean;
  isActive?: boolean;
  badge?: string;
  subItems?: {
    id: string;
    label: string;
    iconName: string;
    badge?: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}
