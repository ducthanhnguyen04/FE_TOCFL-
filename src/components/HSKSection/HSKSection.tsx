'use client';

import React from 'react';
import styles from './HSKSection.module.css';
import { HSKCard } from '../HSKCard/HSKCard';
import { HSK_LEVELS } from '@/data/hskData';
import { HSKLevelItem } from '@/types';

interface HSKSectionProps {
  onCardClick?: (item: HSKLevelItem) => void;
}

export const HSKSection: React.FC<HSKSectionProps> = ({ onCardClick }) => {
  // Main cards are HSK 1 to 6
  const primaryLevels = HSK_LEVELS.slice(0, 6);
  // Peek card is HSK 7-9 (as shown partially at bottom of screenshot)
  const advancedLevels = HSK_LEVELS.slice(6);

  return (
    <section className={styles.section} id="hsk-section">
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.pencilIndicator} aria-hidden="true" />
        <div className={styles.titleArea}>
          <h2 className={styles.sectionTitle}>HSK 3.0</h2>
          <span className={styles.sectionSubtitle}>Bản cải tiến</span>
        </div>
      </div>

      {/* Main 6 Cards Grid */}
      <div className={styles.cardsGrid}>
        {primaryLevels.map((item) => (
          <HSKCard key={item.id} item={item} onClick={onCardClick} />
        ))}
      </div>

      {/* Advanced HSK 7-9 Peek Row */}
      {advancedLevels.length > 0 && (
        <div className={styles.peekRow}>
          {advancedLevels.map((item) => (
            <HSKCard key={item.id} item={item} onClick={onCardClick} />
          ))}
        </div>
      )}
    </section>
  );
};
