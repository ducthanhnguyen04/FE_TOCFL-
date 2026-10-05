'use client';

import React from 'react';
import styles from './HSKCard.module.css';
import { HSKLevelItem } from '@/types';

interface HSKCardProps {
  item: HSKLevelItem;
  onClick?: (item: HSKLevelItem) => void;
}

export const HSKCard: React.FC<HSKCardProps> = ({ item, onClick }) => {
  // Format info text like screenshot: "333 từ vựng • 41 mẫu" or "972 từ vựng"
  const statsLabel = item.patternCount
    ? `${item.wordCount} từ vựng • ${item.patternCount} mẫu`
    : `${item.wordCount} từ vựng`;

  return (
    <article
      className={`${styles.cardContainer} sketch-cross`}
      onClick={() => onClick?.(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(item);
        }
      }}
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
  );
};
