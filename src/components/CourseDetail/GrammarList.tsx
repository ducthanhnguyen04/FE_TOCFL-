import React from 'react';
import { ChevronRight, Lock, Star, Unlock } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { useUser } from '@/providers/UserProvider';
import styles from './CourseDetail.module.css';

interface LessonItem {
  id: string | number;
  displayId?: number;
  title: string;
  vocabCount: number;
  isLocked: boolean;
}

interface GrammarListProps {
  lessons: LessonItem[];
  onSelect?: (id: string | number) => void;
}

export const GrammarList: React.FC<GrammarListProps> = ({ lessons, onSelect }) => {
  const { t } = useLanguage();
  const { user, isPremium, isAdmin, openLoginModal } = useUser();

  const handleItemClick = (lesson: LessonItem) => {
    const isAccessible = !lesson.isLocked || isPremium || isAdmin;
    if (!isAccessible) {
      if (!user) {
        openLoginModal();
        return;
      }
      alert('⭐ Bài học này dành riêng cho tài khoản VIP Premium. Vui lòng liên hệ Admin hoặc nâng cấp tài khoản để truy cập!');
      return;
    }
    onSelect?.(lesson.id);
  };

  return (
    <div className={styles.lessonsList}>
      {lessons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#666', fontStyle: 'italic' }}>
          {t('course.emptyLesson')}
        </div>
      ) : (
        lessons.map((lesson) => {
          const isAccessible = !lesson.isLocked || isPremium || isAdmin;

          return (
            <button
              key={lesson.id}
              className={`${styles.lessonCard} sketch-cross ${lesson.isLocked && !isAccessible ? styles.lessonLocked : ''}`}
              onClick={() => handleItemClick(lesson)}
            >
              <div className={`${styles.lessonNumber} sketch-cross`}>{lesson.displayId || lesson.id}</div>
              <div className={styles.lessonInfo}>
                <h4 className={styles.lessonTitle}>{lesson.title}</h4>
                <p className={styles.lessonDesc}>{lesson.vocabCount} {t('course.grammarUnit')}</p>
              </div>
              <div className={styles.lessonAction}>
                {lesson.isLocked ? (
                  <div className={`${styles.premiumBadge} ${isAccessible ? styles.premiumUnlocked : ''}`}>
                    <Star size={12} fill="#d97706" color="#d97706" />
                    <span>Premium</span>
                    {isAccessible ? (
                      <Unlock size={12} color="#059669" />
                    ) : (
                      <Lock size={12} color="#92400e" />
                    )}
                  </div>
                ) : (
                  <ChevronRight size={20} color="#222" />
                )}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};

