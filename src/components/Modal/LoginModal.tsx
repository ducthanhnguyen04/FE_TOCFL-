import React from 'react';
import { X, Mail, Lock } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import styles from './LoginModal.module.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modalContainer} sketch-cross`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>{t('login.title')}</h2>
            <p className={styles.subtitle}>{t('login.subtitle')}</p>
          </div>
          <button className={`${styles.closeBtn} sketch-cross`} onClick={onClose} title={t('login.close')}>
            <X size={20} />
          </button>
        </div>

        {/* Mascot */}
        <div className={styles.mascotArea}>
          <svg width="60" height="60" viewBox="0 0 54 54" fill="none">
            {/* Mascot Face */}
            <circle cx="28" cy="30" r="18" fill="#d82a24" stroke="#222" strokeWidth="2" />
            {/* Taiwan Flag Motif */}
            <path d="M 10 30 A 18 18 0 0 1 28 12 L 28 30 Z" fill="#000095" />
            <circle cx="20" cy="20" r="2" fill="#fff" />
            <path d="M 20 16 L 20 24 M 16 20 L 24 20 M 17 17 L 23 23 M 17 23 L 23 17" stroke="#fff" strokeWidth="1" />
            {/* Sunglasses */}
            <path
              d="M 17 26 Q 22 25 28 26 Q 34 25 39 26 L 39 29 Q 34 32 28 29 Q 22 32 17 29 Z"
              fill="#222"
              stroke="#222"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M 12 24 L 17 26" stroke="#222" strokeWidth="2" strokeLinecap="round" />
            <path d="M 44 24 L 39 26" stroke="#222" strokeWidth="2" strokeLinecap="round" />
            {/* Cool Smile */}
            <path
              d="M 23 37 Q 28 39 34 36"
              stroke="#222"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Little stars floating */}
            <path d="M 8 18 L 10 22 L 14 23 L 10 24 L 8 28 L 6 24 L 2 23 L 6 22 Z" fill="#f1cf5b" stroke="#222" strokeWidth="1" />
            <path d="M 44 12 L 45 15 L 48 16 L 45 17 L 44 20 L 43 17 L 40 16 L 43 15 Z" fill="#f1cf5b" stroke="#222" strokeWidth="1" />
          </svg>
        </div>

        {/* Social Logins */}
        <div className={styles.socialGroup}>
          <button 
            className={`${styles.socialBtn} sketch-cross`}
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                }
              });
            }}
          >
            <span style={{ color: '#4285F4', fontWeight: 'bold', fontSize: '15px' }}>G</span>
            <span>{t('login.google')}</span>
          </button>
        </div>

        {/* Divider */}
        <div className={styles.divider}>
          <span>{t('login.or')}</span>
        </div>

        {/* Email & Password Form */}
        <form className={styles.formGroup} onSubmit={(e) => e.preventDefault()}>
          <div className={`${styles.inputWrapper} sketch-cross`}>
            <Mail size={16} className={styles.inputIcon} />
            <input type="email" placeholder="Email" className={styles.input} />
          </div>
          <div className={`${styles.inputWrapper} sketch-cross`}>
            <Lock size={16} className={styles.inputIcon} />
            <input type="password" placeholder={t('login.password')} className={styles.input} />
          </div>
          
          <button type="submit" className={`${styles.submitBtn} sketch-cross`}>
            {t('login.submit')}
          </button>
        </form>

        {/* Footer Terms */}
        <div className={styles.footerTerms}>
          {t('login.terms')}
        </div>
      </div>
    </div>
  );
};
