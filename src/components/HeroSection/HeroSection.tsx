'use client';

import React from 'react';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import styles from './HeroSection.module.css';

export interface SocialLinksConfig {
  facebook?: string;
  instagram?: string;
  line?: string;
}

interface HeroSectionProps {
  onLearnMore?: () => void;
  onJoinCommunity?: () => void;
  socialLinks?: SocialLinksConfig;
}

const DEFAULT_SOCIALS: SocialLinksConfig = {
  facebook: 'https://www.facebook.com/nguyen.duc.thanh.0810',
  instagram: 'https://www.instagram.com/_thahnd_/',
  line: 'https://line.me/ti/p/JhHWg2jK9M',
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLearnMore,
  onJoinCommunity,
  socialLinks = DEFAULT_SOCIALS,
}) => {
  const { user } = useUser();
  const { t } = useLanguage();
  const displayName = user?.user_metadata?.full_name || t('hero.defaultName');

  const links = { ...DEFAULT_SOCIALS, ...socialLinks };

  const socialItems = [
    {
      key: 'facebookBtn',
      name: 'Facebook',
      url: links.facebook,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#1877F2" />
          <path
            d="M15.117 12.723l.432-2.817h-2.703V8.077c0-.77.378-1.522 1.587-1.522h1.229V4.156S14.548 4 13.488 4c-2.213 0-3.659 1.341-3.659 3.768v2.138H7.357v2.817h2.472V19.64A12.07 12.07 0 0012 20c.734 0 1.446-.065 2.135-.19v-7.087h2.093z"
            fill="#ffffff"
          />
        </svg>
      ),
    },
    {
      key: 'instagramBtn',
      name: 'Instagram',
      url: links.instagram,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="igGradHero" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#igGradHero)" />
          <rect x="5.5" y="5.5" width="13" height="13" rx="3.5" stroke="#ffffff" strokeWidth="1.6" fill="none" />
          <circle cx="12" cy="12" r="3.2" stroke="#ffffff" strokeWidth="1.6" fill="none" />
          <circle cx="15.8" cy="8.2" r="0.9" fill="#ffffff" />
        </svg>
      ),
    },
    {
      key: 'lineBtn',
      name: 'LINE',
      url: links.line,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#06C755" />
          <path
            d="M19.36 10.04c0-3.87-3.95-7.04-8.8-7.04-4.86 0-8.8 3.17-8.8 7.04 0 3.47 3.07 6.38 7.22 6.92.28.06.66.19.76.44.09.22.06.57.03.8l-.13.77c-.04.23-.18.9.79.49.95-.4 5.14-3.03 7.01-5.18 1.38-1.55 1.92-2.96 1.92-4.24z"
            fill="#ffffff"
          />
          <path
            d="M7.74 11.53H6.38a.38.38 0 01-.38-.38V8.92c0-.21.17-.38.38-.38.21 0 .38.17.38.38v1.85h.98c.21 0 .38.17.38.38 0 .21-.17.38-.38.38zm1.96 0a.38.38 0 01-.38-.38V8.92c0-.21.17-.38.38-.38.21 0 .38.17.38.38v2.23a.38.38 0 01-.38.38zm3.28 0a.38.38 0 01-.35-.23l-1.35-1.92v1.77a.38.38 0 01-.38.38.38.38 0 01-.38-.38V8.92a.38.38 0 01.69-.22l1.35 1.92V8.92c0-.21.17-.38.38-.38.21 0 .38.17.38.38v2.23a.38.38 0 01-.34.38zm2.74-.38a.38.38 0 01.38.38.38.38 0 01-.38.38h-1.36a.38.38 0 01-.38-.38V8.92c0-.21.17-.38.38-.38h1.36a.38.38 0 010 .76h-.98v.35h.85a.38.38 0 010 .76h-.85v.36h.98z"
            fill="#06C755"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className={styles.heroSection}>
      {/* Greeting Title */}
      <div className={styles.greetingHeader}>
        <div className={styles.mascotIcon}>
          <svg viewBox="0 0 40 40" width="36" height="36">
            {/* Taiwan Flag Motif / Sunglasses Mascot */}
            <circle cx="20" cy="20" r="18" fill="#d82924" stroke="#222" strokeWidth="2" />
            <path d="M 2 20 A 18 18 0 0 1 20 2 L 20 20 Z" fill="#000095" opacity="0.6" />
            <circle cx="14" cy="14" r="2.5" fill="#fff" opacity="0.6" />
            <path d="M 14 9 L 14 19 M 9 14 L 19 14 M 10.5 10.5 L 17.5 17.5 M 10.5 17.5 L 17.5 10.5" stroke="#fff" strokeWidth="1" opacity="0.6" />
            {/* Cool Sunglasses */}
            <path
              d="M 9 17 Q 14 15 19 17 Q 19 23 14 24 Q 9 23 9 17 Z"
              fill="#222222"
            />
            <path
              d="M 21 17 Q 26 15 31 17 Q 31 23 26 24 Q 21 23 21 17 Z"
              fill="#222222"
            />
            <line x1="18" y1="18" x2="22" y2="18" stroke="#222" strokeWidth="2.5" />
            {/* White highlights on sunglasses */}
            <line x1="11" y1="19" x2="14" y2="19" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="23" y1="19" x2="26" y2="19" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            {/* Cute Smile */}
            <path
              d="M 16 27 Q 20 31 24 27"
              stroke="#222222"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className={styles.heading}>
          <span>{t('hero.hello')}</span>
          <span className={styles.highlightWord}>{displayName}</span>
          <span className={styles.waveEmoji} role="img" aria-label="Waving hand">
            👏
          </span>
        </h1>
      </div>

      {/* Intro Description */}
      <div className={styles.introText}>
        <p>
          {t('hero.intro')}
        </p>
      </div>

      {/* Social networks list */}
      <div className={styles.socialRow}>
        <span className={styles.socialLabel}>
          {t('hero.socialLabel') || 'Mạng xã hội của mình:'}
        </span>
        <div className={styles.socialList}>
          {socialItems.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles[item.key]}`}
              title={`Theo dõi qua ${item.name}`}
            >
              <span className={styles.socialIconWrap}>{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
