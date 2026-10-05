'use client';

import React from 'react';
import Link from 'next/link';
import styles from './TOCFLCard.module.css';
import { TOCFLLevelItem } from '@/types';

interface TOCFLCardProps {
  item: TOCFLLevelItem;
  onClick?: (item: TOCFLLevelItem) => void;
}

export const TOCFLCard: React.FC<TOCFLCardProps> = ({ item, onClick }) => {
  // Format info text like screenshot: "333 từ vựng • 41 mẫu" or "972 từ vựng"
  const statsLabel = item.patternCount
    ? `${item.wordCount} từ vựng • ${item.patternCount} mẫu`
    : `${item.wordCount} từ vựng`;

  return (
    <Link href={`/course/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article
        className={`${styles.cardContainer} sketch-cross`}
        role="button"
        tabIndex={0}
        aria-label={`${item.title} - ${statsLabel}`}
      >
        {/* Upper Red Crayon / Chalk Banner */}
        <div className={styles.topBanner}>
          <h2 className={styles.cardTitle}>{item.title}</h2>
        </div>

        {/* Lower Mustard Gold Stats Bar */}
        <div className={styles.bottomStrip}>
          <span className={styles.statsText}>{statsLabel}</span>
        </div>
      </article>
    </Link>
  );
};
