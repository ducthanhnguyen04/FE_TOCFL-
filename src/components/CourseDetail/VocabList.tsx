import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import styles from './CourseDetail.module.css';

interface LessonItem {
  id: number;
  title: string;
  vocabCount: number;
  isLocked: boolean;
}

interface VocabListProps {
  lessons: LessonItem[];
  onSelect?: (id: number) => void;
}

export const VocabList: React.FC<VocabListProps> = ({ lessons, onSelect }) => {
  return (
    <div className={styles.lessonsList}>
      {lessons.map((lesson) => (
        <button
          key={lesson.id}
          className={`${styles.lessonCard} sketch-cross ${lesson.isLocked ? styles.lessonLocked : ''}`}
          onClick={() => !lesson.isLocked && onSelect?.(lesson.id)}
        >
          <div className={`${styles.lessonNumber} sketch-cross`}>{lesson.id}</div>
          <div className={styles.lessonInfo}>
            <h4 className={styles.lessonTitle}>{lesson.title}</h4>
            <p className={styles.lessonDesc}>{lesson.vocabCount} từ vựng</p>
          </div>
          <div className={styles.lessonAction}>
            {lesson.isLocked ? (
              <Lock size={18} color="#888" />
            ) : (
              <ChevronRight size={20} color="#222" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
