'use client';

import React from 'react';
import styles from './TOCFLSection.module.css';
import { TOCFLCard } from '../TOCFLCard/TOCFLCard';
import { TOCFL_LEVELS } from '@/data/tocflData';
import { TOCFLLevelItem } from '@/types';
import { useLanguage } from '@/providers/LanguageProvider';

interface TOCFLSectionProps {
  title: string;
  levels: TOCFLLevelItem[];
  onCardClick?: (item: TOCFLLevelItem) => void;
}

export const TOCFLSection: React.FC<TOCFLSectionProps> = ({ title, levels, onCardClick }) => {
  const { t } = useLanguage();

  return (
    <section className={styles.section} id="tocfl-section">
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.pencilIndicator} aria-hidden="true" />
        <div className={styles.titleArea}>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
      </div>

      {/* Cards Grid */}
      <div className={styles.cardsGrid}>
        {levels.map((item) => (
          <TOCFLCard key={item.id} item={item} onClick={onCardClick} />
        ))}
      </div>
    </section>
  );
};
