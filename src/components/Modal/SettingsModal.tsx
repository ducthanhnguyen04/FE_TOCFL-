import React, { useEffect, useState } from 'react';
import { X, Palette, Sun, Moon, Languages, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const languages = [
  'Tiếng Việt',
  'English',
  '日本語',
  '한국어',
  'Bahasa Indonesia',
  'ภาษาไทย',
  'Русский'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState('Tiếng Việt');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={`${styles.modalContent} sketch-box`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className={styles.header}>
          <Palette size={22} strokeWidth={2.5} />
          <h2>Cài đặt</h2>
        </div>
        <p className={styles.subtitle}>
          Chế độ hiển thị, ngôn ngữ giao diện, giọng đọc và trợ lý AI.
        </p>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Chế độ hiển thị</h3>
          {mounted && (
            <div className={styles.themeGrid}>
              <button 
                className={`${styles.themeCard} ${theme === 'light' ? styles.activeTheme : ''} sketch-box`}
                onClick={() => setTheme('light')}
              >
                <Sun size={24} strokeWidth={2} />
                <span>Sáng</span>
                {theme === 'light' && <Check size={16} className={styles.checkIcon} />}
              </button>
              <button 
                className={`${styles.themeCard} ${theme === 'dark' ? styles.activeTheme : ''} sketch-box`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={24} strokeWidth={2} />
                <span>Tối</span>
                {theme === 'dark' && <Check size={16} className={styles.checkIcon} />}
              </button>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Languages size={18} strokeWidth={2} className={styles.langIcon} />
            Ngôn ngữ giao diện
          </h3>
          <div className={styles.langGrid}>
            {languages.map((l) => (
              <button
                key={l}
                className={`${styles.langCard} ${lang === l ? styles.activeLang : ''} sketch-box`}
                onClick={() => setLang(l)}
              >
                <span>{l}</span>
                {lang === l && <Check size={14} className={styles.checkIcon} />}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          Áp dụng cho menu và nút bấm — nội dung bài học giữ nguyên tiếng Việt.
        </div>
      </div>
    </div>
  );
};
