'use client';

import React from 'react';
import styles from './TOCFLSection.module.css';
import { TOCFLCard } from '../TOCFLCard/TOCFLCard';
import { TOCFL_LEVELS } from '@/data/tocflData';
import { TOCFLLevelItem } from '@/types';
import { useLanguage } from '@/providers/LanguageProvider';

interface TOCFLSectionProps {
  levels: TOCFLLevelItem[];
  onCardClick?: (item: TOCFLLevelItem) => void;
}

export const TOCFLSection: React.FC<TOCFLSectionProps> = ({ levels, onCardClick }) => {
  const { t } = useLanguage();
  // Main cards are TOCFL 1 to 6
  const primaryLevels = levels.slice(0, 6);
  // Peek card is TOCFL 7-9 (as shown partially at bottom of screenshot)
  const advancedLevels = levels.slice(6);

  return (
    <section className={styles.section} id="tocfl-section">
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.pencilIndicator} aria-hidden="true" />
        <div className={styles.titleArea}>
          <h2 className={styles.sectionTitle}>TOCFL 3.0</h2>
          <span className={styles.sectionSubtitle}>{t('home.improvedVersion')}</span>
        </div>
      </div>

      {/* Main 6 Cards Grid */}
      <div className={styles.cardsGrid}>
        {primaryLevels.map((item) => (
          <TOCFLCard key={item.id} item={item} onClick={onCardClick} />
        ))}
      </div>

      {/* Advanced TOCFL 7-9 Peek Row */}
      {advancedLevels.length > 0 && (
        <div className={styles.peekRow}>
          {advancedLevels.map((item) => (
            <TOCFLCard key={item.id} item={item} onClick={onCardClick} />
          ))}
        </div>
      )}
    </section>
  );
};
