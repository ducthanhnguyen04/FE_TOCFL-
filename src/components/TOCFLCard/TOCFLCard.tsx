'use client';

import React from 'react';
import Link from 'next/link';
import styles from './TOCFLCard.module.css';
import { TOCFLLevelItem } from '@/types';
import { useLanguage } from '@/providers/LanguageProvider';

interface TOCFLCardProps {
  item: TOCFLLevelItem;
  onClick?: (item: TOCFLLevelItem) => void;
}

export const TOCFLCard: React.FC<TOCFLCardProps> = ({ item, onClick }) => {
  const { t } = useLanguage();
  // Format info text like screenshot: "333 từ vựng • 41 mẫu" or "972 từ vựng"
  const statsLabel = item.patternCount
    ? `${item.wordCount} ${t('course.vocabUnit')} • ${item.patternCount} ${t('course.patternUnit')}`
    : `${item.wordCount} ${t('course.vocabUnit')}`;

  return (
    <Link href={`/course/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article
        className={`${styles.cardContainer} sketch-cross`}
        role="button"
        tabIndex={0}
        aria-label={`${item.title} - ${statsLabel}`}
      >
        <div className={styles.bookInner}>
          <span className={styles.bookBrand}>Nhai</span>
          <h2 className={styles.cardTitle}>{item.title}</h2>
        </div>
      </article>
    </Link>
  );
};
