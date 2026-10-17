import React, { useState, useEffect } from 'react';
import styles from './CourseDetail.module.css';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { TOCFLLevelItem } from '@/types';
import { VocabList } from './VocabList';
import { GrammarList } from './GrammarList';
import { HanziList } from './HanziList';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { useUser } from '@/providers/UserProvider';

interface CourseDetailProps {
  item: TOCFLLevelItem;
  onBack: () => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ item, onBack }) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar' | 'hanzi'>('vocab');
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const { user, isPremium, isAdmin, openLoginModal } = useUser();
  const [dbLessons, setDbLessons] = useState<any[]>([]);

  useEffect(() => {
    const fetchLessons = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('bookId', item.id)
        .order('createdAt', { ascending: true });
      
      if (data) {
        // Hàm trích xuất số bài học (Ví dụ: "Bài 1 - Tân đồng học" -> 1, "Bài 16" -> 16)
        const extractLessonNum = (name: string) => {
          if (!name) return 999999;
          const match = name.match(/(?:bài|lesson|chương|unit|đoạn|phần|tiết|第)\s*(\d+)/i) || name.match(/\d+/);
          return match ? parseInt(match[1] || match[0], 10) : 999999;
        };

        // Sắp xếp tự nhiên theo thứ tự bài học (Bài 1 -> Bài 2 -> ... -> Bài 16)
        const sortedData = [...data].sort((a, b) => {
          const numA = extractLessonNum(a.lessonName);
          const numB = extractLessonNum(b.lessonName);
          if (numA !== numB) return numA - numB;
          return (a.lessonName || '').localeCompare(b.lessonName || '', undefined, { numeric: true, sensitivity: 'base' });
        });

        const mappedLessons = sortedData.map((d, index) => {
          const num = extractLessonNum(d.lessonName);
          return {
            id: d.id,
            displayId: num !== 999999 ? num : index + 1,
            title: d.lessonName,
            vocabCount: d.wordCount || 0,
            isLocked: d.isLocked || false
          };
        });
        setDbLessons(mappedLessons);
      }
    };
    
    if (item.id) {
      fetchLessons();
    }
  }, [item.id]);
  
  const handleLessonSelect = (lessonId: string | number) => {
    if (!user) {
      openLoginModal();
      return;
    }
    const targetLesson = dbLessons.find(l => l.id === lessonId);
    if (targetLesson?.isLocked && !isPremium && !isAdmin) {
      alert('⭐ Bài học này chỉ dành riêng cho tài khoản VIP Premium. Vui lòng liên hệ Admin để nâng cấp gói tài khoản!');
      return;
    }
    router.push(`/course/${params.id}/lesson/${lessonId}`);
  };

  return (
    <div className={styles.courseDetailWrapper} style={{ animation: 'fadeIn 0.3s ease' }}>
      <button onClick={onBack} className={styles.backBtn}>
        <ChevronLeft size={16} />
        <span>{t('course.home')}</span>
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
            <span className={styles.lessonCountBadge}>15 {t('course.lessonCount')}</span>
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
        <h3 className={styles.sectionLabel}>{t('course.skills')}</h3>
        <div className={styles.tabsRow}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'vocab' ? styles.tabBtnActive : ''} sketch-cross`}
            onClick={() => setActiveTab('vocab')}
          >
            {t('course.vocabTab')}
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'grammar' ? styles.tabBtnActive : ''} sketch-cross`}
            onClick={() => setActiveTab('grammar')}
          >
            {t('course.grammarTab')}
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'hanzi' ? styles.tabBtnActive : ''} sketch-cross`}
            onClick={() => setActiveTab('hanzi')}
          >
            {t('course.hanziTab')}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab !== 'hanzi' ? (
        <>
          {/* Progress */}
          <div className={`${styles.progressSection} sketch-cross`}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>{t('course.progressTitle')}</span>
              <span className={styles.progressText}>0/{dbLessons.length} {t('course.lessonCount')}</span>
            </div>
            <div className={`${styles.progressBarTrack} sketch-cross`}>
              <div className={styles.progressBarFill} style={{ width: '0%' }}></div>
            </div>
            <div className={styles.progressPercentage}>0%</div>
          </div>

          {/* Lessons List */}
          <div className={styles.lessonsSection}>
            <h3 className={styles.sectionLabel}>{t('course.lessonsLabel')}</h3>
            <div className={styles.lessonsList}>
              {activeTab === 'vocab' && <VocabList lessons={dbLessons} onSelect={handleLessonSelect} />}
              {activeTab === 'grammar' && <GrammarList lessons={dbLessons} onSelect={handleLessonSelect} />}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.lessonsSection}>
          <HanziList lessons={dbLessons} />
        </div>
      )}
    </div>
  );
};
