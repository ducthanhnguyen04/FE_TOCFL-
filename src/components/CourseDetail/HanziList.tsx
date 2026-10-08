import React, { useState, useEffect } from 'react';
import { Layers, PenTool, FileText, Loader } from 'lucide-react';
import styles from './HanziList.module.css';
import { PracticeSheetModal } from '../Modal/PracticeSheetModal';
import { useLanguage } from '@/providers/LanguageProvider';
import { createClient } from '@/lib/supabase/client';

interface LessonItem {
  id: string | number;
  displayId?: number;
  title: string;
  vocabCount: number;
  isLocked: boolean;
}

interface HanziListProps {
  lessons: LessonItem[];
}

export const HanziList: React.FC<HanziListProps> = ({ lessons }) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [characters, setCharacters] = useState<string[]>([]);
  const [vocabData, setVocabData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLanguage();

  useEffect(() => {
    const fetchHanzi = async () => {
      if (!lessons || lessons.length === 0) {
        setCharacters([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const lessonIds = lessons.map(l => l.id);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('vocabularies')
        .select('vocabulary, pinyin, vietnameseMeaning, englishMeaning, indonesiaMeaning')
        .in('lessonId', lessonIds);
        
      if (data) {
        setVocabData(data);
        const uniqueChars = new Set<string>();
        data.forEach(item => {
          if (item.vocabulary) {
            for (const char of item.vocabulary) {
              if (char.match(/[\u4e00-\u9fa5]/)) {
                uniqueChars.add(char);
              }
            }
          }
        });
        setCharacters(Array.from(uniqueChars));
      } else {
        console.error('Error fetching hanzi:', error);
      }
      setLoading(false);
    };

    fetchHanzi();
  }, [lessons]);

  return (
    <div className={styles.hanziWrapper}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.sectionTitle}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader size={16} className={styles.spinner} /> {t('lesson.loading')}
            </span>
          ) : (
            <span>{characters.length} {t('course.newHanzi')}</span>
          )}
        </div>
        
        <div className={styles.actionsGroup}>
          <button className={`${styles.actionBtn} ${styles.flashcardBtn} sketch-cross`}>
            <Layers size={14} />
            <span>{t('course.flashcard')}</span>
          </button>
          <button className={`${styles.actionBtn} sketch-cross`}>
            <PenTool size={14} />
            <span>{t('course.practice')}</span>
          </button>
          <button 
            className={`${styles.actionBtn} sketch-cross`}
            onClick={() => setIsPrintModalOpen(true)}
          >
            <FileText size={14} />
            <span>{t('course.createFile')}</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className={`${styles.gridContainer} sketch-cross`}>
        <div className={styles.grid}>
          {characters.map((char) => (
            <div key={char} className={styles.charBox}>
              {char}
            </div>
          ))}
        </div>
      </div>

      <PracticeSheetModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        items={vocabData.map(v => ({
          char: v.vocabulary,
          pinyin: v.pinyin,
          meaning: lang === 'en' && v.englishMeaning ? v.englishMeaning : 
                   lang === 'id' && v.indonesiaMeaning ? v.indonesiaMeaning : 
                   v.vietnameseMeaning
        }))}
      />
    </div>
  );
};
