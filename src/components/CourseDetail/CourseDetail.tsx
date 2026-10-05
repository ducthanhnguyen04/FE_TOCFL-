import React, { useState } from 'react';
import styles from './CourseDetail.module.css';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { TOCFLLevelItem } from '@/types';
import { VocabList } from './VocabList';
import { GrammarList } from './GrammarList';
import { HanziList } from './HanziList';

interface CourseDetailProps {
  item: TOCFLLevelItem;
  onBack: () => void;
}

const mockLessons = [
  { id: 1, title: 'Xin chào!', vocabCount: 13, isLocked: false },
  { id: 2, title: 'Tôi tên là NhaiTOCFL', vocabCount: 15, isLocked: true },
  { id: 3, title: 'Tôi là người Việt Nam', vocabCount: 22, isLocked: true },
  { id: 4, title: 'Tôi có hai đứa con', vocabCount: 21, isLocked: true },
  { id: 5, title: 'Hôm nay tôi nghỉ', vocabCount: 22, isLocked: true },
];

export const CourseDetail: React.FC<CourseDetailProps> = ({ item, onBack }) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar' | 'hanzi'>('vocab');
  
  return (
    <div className={styles.courseDetailWrapper} style={{ animation: 'fadeIn 0.3s ease' }}>
      <button onClick={onBack} className={styles.backBtn}>
        <ChevronLeft size={16} />
        <span>Trang chủ</span>
      </button>

      {/* Header Info */}
      <div className={styles.headerArea}>
        {/* Book Cover */}
        <div className={`${styles.bookCover} sketch-cross`}>
          <div className={styles.bookInner}>
            <span className={styles.bookBrand}>Nhai</span>
            <span className={styles.bookTitle}>{item.title}</span>
          </div>
        </div>

        {/* Info Box */}
        <div className={styles.infoBox}>
          <div className={styles.topBadges}>
            <span className={`${styles.levelBadge} sketch-cross`}>{item.title}</span>
            <span className={styles.lessonCountBadge}>15 bài</span>
          </div>

          <div className={styles.titleRow}>
            {/* Small Mascot */}
            <div className={styles.smallMascot}>
              <svg viewBox="0 0 40 40" width="48" height="48">
                <circle cx="20" cy="20" r="18" fill="#d82924" stroke="#222" strokeWidth="2" />
                <path d="M 12 18 Q 20 10 28 18 Q 28 26 20 30 Q 12 26 12 18 Z" fill="#2b7fd4" opacity="0.9" stroke="#222" strokeWidth="1.5" />
                <circle cx="16" cy="18" r="2" fill="#fff" />
                <circle cx="24" cy="18" r="2" fill="#fff" />
              </svg>
            </div>
            <h1 className={styles.mainTitle}>{item.title} 3.0</h1>
          </div>
          <p className={styles.subtitle}>标准教程 {item.title} - 3.0</p>
        </div>
      </div>

      {/* Skills Tabs */}
      <div className={styles.skillsSection}>
        <h3 className={styles.sectionLabel}>KỸ NĂNG</h3>
        <div className={styles.tabsRow}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'vocab' ? styles.tabBtnActive : ''} sketch-cross`}
            onClick={() => setActiveTab('vocab')}
          >
            ✨ Từ vựng - 词汇
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'grammar' ? styles.tabBtnActive : ''} sketch-cross`}
            onClick={() => setActiveTab('grammar')}
          >
            📄 Ngữ pháp - 语法
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'hanzi' ? styles.tabBtnActive : ''} sketch-cross`}
            onClick={() => setActiveTab('hanzi')}
          >
            🖍 Chữ Hán - 汉字
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab !== 'hanzi' ? (
        <>
          {/* Progress */}
          <div className={`${styles.progressSection} sketch-cross`}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Tiến độ học</span>
              <span className={styles.progressText}>0/15 bài</span>
            </div>
            <div className={`${styles.progressBarTrack} sketch-cross`}>
              <div className={styles.progressBarFill} style={{ width: '0%' }}></div>
            </div>
            <div className={styles.progressPercentage}>0%</div>
          </div>

          {/* Lessons List */}
          <div className={styles.lessonsSection}>
            <h3 className={styles.sectionLabel}>BÀI HỌC</h3>
            <div className={styles.lessonsList}>
              {activeTab === 'vocab' && <VocabList lessons={mockLessons} />}
              {activeTab === 'grammar' && <GrammarList lessons={mockLessons} />}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.lessonsSection}>
          <HanziList lessons={mockLessons} />
        </div>
      )}
    </div>
  );
};
