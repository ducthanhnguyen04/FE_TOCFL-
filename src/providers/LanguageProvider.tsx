'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'vi' | 'en' | 'id';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  vi: {
    'menu.home': 'Trang chủ',
    'menu.platform': 'Nền tảng',
    'menu.pinyin': 'Bảng Pinyin',
    'menu.radicals': '214 Bộ Thủ',
    'menu.rules': 'Quy tắc chuyển âm',
    'menu.personalize': 'Cá nhân hoá',
    'menu.route': 'Lộ trình',
    'menu.review': 'Ôn tập',
    'menu.vocab': 'Sổ tay từ vựng',
    'menu.grammar': 'Sổ tay ngữ pháp',
    'menu.progress': 'Tiến độ học',
    'menu.dictionary': 'Tra từ điển',
    'menu.dict-search': 'Tra từ điển',
    'menu.character-analysis': 'Phân tích Hán tự',
    'menu.shadowing': 'Shadowing',
    'menu.lessons': 'Bài khoá',
    'menu.certificates': 'Luyện thi chứng chỉ',
    'menu.create-file': 'Tạo file',
    'menu.leaderboard': 'Bảng xếp hạng',
    'menu.feedback': 'Phản hồi',
    'menu.settings': 'Cài đặt',
    'settings.title': 'Cài đặt',
    'settings.subtitle': 'Chế độ hiển thị, ngôn ngữ giao diện, giọng đọc và trợ lý AI.',
    'settings.theme': 'Chế độ hiển thị',
    'settings.theme.light': 'Sáng',
    'settings.theme.dark': 'Tối',
    'settings.language': 'Ngôn ngữ giao diện',
    'home.title': 'Trang chủ',
    'lesson.vocab': 'Từ vựng',
    'lesson.grammar': 'Ngữ pháp',
    'lesson.hanzi': 'Chữ Hán',
    'lesson.auto': 'Tự động',
    'lesson.stop': 'Dừng phát',
    'lesson.list': 'Danh sách bài',
    'lesson.print': 'In file',
    'lesson.addReview': 'Thêm cả bài vào ôn tập',
    'lesson.hint': '✨ Click để lật xem nghĩa'
  },
  en: {
    'menu.home': 'Home',
    'menu.platform': 'Platform',
    'menu.pinyin': 'Pinyin Chart',
    'menu.radicals': '214 Radicals',
    'menu.rules': 'Phonetic Rules',
    'menu.personalize': 'Personalize',
    'menu.route': 'Learning Route',
    'menu.review': 'Review',
    'menu.vocab': 'Vocab Notebook',
    'menu.grammar': 'Grammar Notebook',
    'menu.progress': 'Progress',
    'menu.dictionary': 'Dictionary',
    'menu.dict-search': 'Search Dictionary',
    'menu.character-analysis': 'Character Analysis',
    'menu.shadowing': 'Shadowing',
    'menu.lessons': 'Lessons',
    'menu.certificates': 'Certificates',
    'menu.create-file': 'Create File',
    'menu.leaderboard': 'Leaderboard',
    'menu.feedback': 'Feedback',
    'menu.settings': 'Settings',
    'settings.title': 'Settings',
    'settings.subtitle': 'Display mode, interface language, reading voice and AI assistant.',
    'settings.theme': 'Display Mode',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.language': 'Interface Language',
    'home.title': 'Home',
    'lesson.vocab': 'Vocabulary',
    'lesson.grammar': 'Grammar',
    'lesson.hanzi': 'Characters',
    'lesson.auto': 'Auto-play',
    'lesson.stop': 'Stop',
    'lesson.list': 'Lesson List',
    'lesson.print': 'Print file',
    'lesson.addReview': 'Add lesson to review',
    'lesson.hint': '✨ Click to flip for meaning'
  },
  id: {
    'menu.home': 'Beranda',
    'menu.platform': 'Platform',
    'menu.pinyin': 'Bagan Pinyin',
    'menu.radicals': '214 Radikal',
    'menu.rules': 'Aturan Fonetik',
    'menu.personalize': 'Personalisasi',
    'menu.route': 'Rute Belajar',
    'menu.review': 'Ulasan',
    'menu.vocab': 'Buku Kosakata',
    'menu.grammar': 'Buku Tata Bahasa',
    'menu.progress': 'Kemajuan',
    'menu.dictionary': 'Kamus',
    'menu.dict-search': 'Cari Kamus',
    'menu.character-analysis': 'Analisis Karakter',
    'menu.shadowing': 'Shadowing',
    'menu.lessons': 'Pelajaran',
    'menu.certificates': 'Sertifikat',
    'menu.create-file': 'Buat File',
    'menu.leaderboard': 'Papan Peringkat',
    'menu.feedback': 'Umpan Balik',
    'menu.settings': 'Pengaturan',
    'settings.title': 'Pengaturan',
    'settings.subtitle': 'Mode tampilan, bahasa antarmuka, suara bacaan, dan asisten AI.',
    'settings.theme': 'Mode Tampilan',
    'settings.theme.light': 'Terang',
    'settings.theme.dark': 'Gelap',
    'settings.language': 'Bahasa Antarmuka',
    'home.title': 'Beranda',
    'lesson.vocab': 'Kosakata',
    'lesson.grammar': 'Tata Bahasa',
    'lesson.hanzi': 'Karakter',
    'lesson.auto': 'Putar Otomatis',
    'lesson.stop': 'Berhenti',
    'lesson.list': 'Daftar Pelajaran',
    'lesson.print': 'Cetak file',
    'lesson.addReview': 'Tambahkan ke ulasan',
    'lesson.hint': '✨ Klik untuk membalik arti'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>('vi');

  useEffect(() => {
    const savedLang = localStorage.getItem('app-lang') as Language;
    if (savedLang && (savedLang === 'vi' || savedLang === 'en' || savedLang === 'id')) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app-lang', newLang);
  };

  const t = (key: string): string => {
    return (translations[lang] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
