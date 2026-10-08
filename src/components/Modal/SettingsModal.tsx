import React, { useEffect, useState } from 'react';
import { X, Palette, Sun, Moon, Languages, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/LanguageProvider';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const languages = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
  { id: 'id', label: 'Bahasa Indonesia' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
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
          <h2>{t('settings.title')}</h2>
        </div>
        <p className={styles.subtitle}>
          {t('settings.subtitle')}
        </p>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('settings.theme')}</h3>
          {mounted && (
            <div className={styles.themeGrid}>
              <button 
                className={`${styles.themeCard} ${theme === 'light' ? styles.activeTheme : ''} sketch-box`}
                onClick={() => setTheme('light')}
              >
                <Sun size={24} strokeWidth={2} />
                <span>{t('settings.theme.light')}</span>
                {theme === 'light' && <Check size={16} className={styles.checkIcon} />}
              </button>
              <button 
                className={`${styles.themeCard} ${theme === 'dark' ? styles.activeTheme : ''} sketch-box`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={24} strokeWidth={2} />
                <span>{t('settings.theme.dark')}</span>
                {theme === 'dark' && <Check size={16} className={styles.checkIcon} />}
              </button>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Languages size={18} strokeWidth={2} className={styles.langIcon} />
            {t('settings.language')}
          </h3>
          <div className={styles.langGrid}>
            {languages.map((l) => (
              <button
                key={l.id}
                className={`${styles.langCard} ${lang === l.id ? styles.activeLang : ''} sketch-box`}
                onClick={() => setLang(l.id as any)}
              >
                <span>{l.label}</span>
                {lang === l.id && <Check size={14} className={styles.checkIcon} />}
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
