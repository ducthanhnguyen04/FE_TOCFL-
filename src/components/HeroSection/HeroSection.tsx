'use client';

import React from 'react';
import { useUser } from '@/providers/UserProvider';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  onLearnMore?: () => void;
  onJoinCommunity?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLearnMore,
  onJoinCommunity,
}) => {
  const { user } = useUser();
  const displayName = user?.user_metadata?.full_name || 'bạn';

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
          <span>Chào</span>
          <span className={styles.highlightWord}>{displayName}</span>
          <span className={styles.waveEmoji} role="img" aria-label="Waving hand">
            👏
          </span>
        </h1>
      </div>

      {/* Intro Description */}
      <div className={styles.introText}>
        <p>
          Tiếp tục hành trình từ vựng tiếng Đài Loan của bạn — mỗi ngày một chút là đủ.
        </p>
        <p>
          Nhai TOCFL là website miễn phí giúp bạn tự học tiếng Đài Loan và luyện thi TOCFL 3.0 (cấp 1–9): giáo trình từ vựng – ngữ pháp, bảng pinyin, bộ thủ, từ điển, shadowing video và ôn tập ngắt quãng.{' '}
          <a
            href="#tocfl-intro"
            className={styles.learnMoreLink}
            onClick={(e) => {
              e.preventDefault();
              onLearnMore?.();
            }}
          >
            Tìm hiểu thêm về Nhai TOCFL
          </a>
        </p>
      </div>

      {/* Community group invite */}
      <div className={styles.communityRow}>
        <span className={styles.communityLabel}>
          Vào nhóm học cùng mọi người nhé:
        </span>
        <button
          type="button"
          className={styles.communityBtn}
          onClick={onJoinCommunity}
        >
          <span className={styles.pinIcon}>🎈</span>
          <span>Nhai tiếng Đài Loan mỗi ngày</span>
        </button>
      </div>
    </section>
  );
};
