import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Play, Shuffle, Settings, Volume2, Flag, Star, Printer, X, Check } from 'lucide-react';
import styles from './LessonDetail.module.css';
import { QuizMode } from './QuizMode';

interface LessonDetailProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
}

import { createClient } from '@/lib/supabase/client';
const studyModes = [
  { id: 'flashcard', title: 'Flashcard', status: 'Chưa học' },
  { id: 'quiz', title: 'Trắc nghiệm', status: 'Chưa học' },
  { id: 'typing', title: 'Gõ từ', status: 'Chưa học' },
  { id: 'reading', title: 'Đọc hiểu', status: 'Chưa học' },
  { id: 'listening', title: 'Nghe ghép câu', status: 'Chưa học' },
  { id: 'hanzi_dance', title: 'Hanzi Dance', status: 'Chưa học' },
  { id: 'arena', title: 'Đấu trí', status: 'Xếp hạng' },
];

export const LessonDetail: React.FC<LessonDetailProps> = ({ courseId, lessonId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'example'>('vocab');
  const [activeMode, setActiveMode] = useState('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [vocabs, setVocabs] = useState<any[]>([]);
  const [lessonName, setLessonName] = useState('Đang tải...');

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();
        
      if (lessonData) setLessonName(lessonData.lessonName);
      
      const { data: vocabData } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('lessonId', lessonId)
        .order('createdAt', { ascending: true });
        
      if (vocabData) {
        const mappedVocabs = vocabData.map((v) => ({
          id: v.id,
          hanzi: v.vocabulary,
          pinyin: v.pinyin,
          meaning: v.vietnameseMeaning,
          tag: 'Từ vựng', // Fallback tag since we don't have tags in db
          example: null,
          examplePinyin: null,
          exampleMeaning: null
        }));
        setVocabs(mappedVocabs);
        setCurrentIndex(0);
      }
    };
    fetchData();
  }, [lessonId]);

  const currentVocab = vocabs[currentIndex] || {};

  const handleNext = () => {
    if (currentIndex < vocabs.length - 1) {
      setSlideDirection('left');
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSlideDirection('right');
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text || typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Lấy danh sách giọng đọc của hệ điều hành
    const voices = window.speechSynthesis.getVoices();
    
    // Tìm giọng xịn nhất có thể (các giọng "Online" hoặc Premium của Windows/Mac)
    let bestVoice = voices.find(v => v.name.includes('HsiaoChen') || v.name.includes('HsiaoYu') || v.name.includes('Mei-Jia')); 
    if (!bestVoice) bestVoice = voices.find(v => v.lang === 'zh-TW'); // Fallback Đài Loan
    if (!bestVoice) bestVoice = voices.find(v => v.name.includes('Xiaoxiao') || v.name.includes('Ting-Ting')); // Fallback Trung Quốc xịn
    if (!bestVoice) bestVoice = voices.find(v => v.lang.includes('zh')); // Fallback bất kỳ giọng tiếng Trung nào
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    } else {
      utterance.lang = 'zh-TW';
    }
    
    utterance.rate = 0.85; // Đọc chậm lại một chút xíu cho chuẩn
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.lessonWrapper} style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <button onClick={onBack} className={styles.backBtn}>
          <ChevronLeft size={16} />
          <span>Danh sách bài</span>
        </button>
        <button className={`${styles.pinyinBtn} sketch-cross`}>
          <Eye size={16} />
          <span>Pinyin</span>
        </button>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.lessonMeta}>
          <span className={`${styles.lessonBadge} sketch-box`}>{lessonName}</span>
          <span className={styles.vocabCount}>{vocabs.length} từ vựng</span>
        </div>
        <div className={styles.titleRow}>
          <div className={styles.mascot}>
            <svg viewBox="0 0 40 40" width="40" height="40">
              <circle cx="20" cy="20" r="18" fill="#d82924" stroke="#222" strokeWidth="2" />
              <path d="M 10 18 Q 20 10 30 18 Q 30 26 20 30 Q 10 26 10 18 Z" fill="#2b7fd4" opacity="0.9" stroke="#222" strokeWidth="1.5" />
              <circle cx="16" cy="18" r="2" fill="#fff" />
              <circle cx="24" cy="18" r="2" fill="#fff" />
            </svg>
          </div>
          <h1 className={styles.mainTitle}>{lessonName}</h1>
        </div>
        <p className={styles.subtitle}>{lessonName} — Từ vựng HSK</p>
      </div>

      {/* Main Container based on active mode */}
      {activeMode === 'flashcard' && (
        <div className={`${styles.flashcardContainer} sketch-box`}>
          {/* Flashcard Header */}
        <div className={styles.fcHeader}>
          <div className={styles.fcTabs}>
            <button 
              className={`${styles.fcTabBtn} ${activeTab === 'vocab' ? styles.fcTabActive : ''} sketch-cross`}
              onClick={() => setActiveTab('vocab')}
            >
              📚 Từ vựng
            </button>
            <button 
              className={`${styles.fcTabBtn} ${activeTab === 'example' ? styles.fcTabActive : ''} sketch-cross`}
              onClick={() => setActiveTab('example')}
            >
              📖 Ví dụ
            </button>
          </div>
          
          <div className={`${styles.fcCounter} sketch-cross`}>
            {vocabs.length > 0 ? currentIndex + 1 : 0} / {vocabs.length}
          </div>

          <div className={styles.fcControls}>
            <button className={`${styles.fcControlBtn} sketch-cross`}><RefreshCw size={14} /> ZH → VI</button>
            <button className={`${styles.fcControlBtn} sketch-cross`}><Play size={14} /> Tự động</button>
            <button className={`${styles.fcControlBtn} sketch-cross`}><Shuffle size={14} /> Xáo trộn</button>
            <button className={`${styles.fcControlBtn} sketch-cross`}><Settings size={14} /></button>
          </div>
        </div>

        {/* Flashcard Content */}
        <div 
          key={currentIndex} 
          className={`${styles.fcContent} ${slideDirection === 'left' ? styles.slideLeft : slideDirection === 'right' ? styles.slideRight : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`${styles.flipCardInner} ${isFlipped ? styles.isFlipped : ''}`}>
            
            {/* Front Side: Hanzi, Pinyin, Sino */}
            <div className={styles.flipCardFront}>
              <div className={styles.hanziDisplay}>
                {currentVocab.hanzi && currentVocab.hanzi.split('').map((char: string, idx: number) => (
                  <div key={idx} className={`${styles.hanziChar} sketch-box`}>
                    <div className={styles.hanziGridLines}>
                      <div className={styles.hline}></div>
                      <div className={styles.vline}></div>
                    </div>
                    <span>{char}</span>
                    <button className={styles.expandIcon} onClick={e => e.stopPropagation()}><Eye size={12} /></button>
                  </div>
                ))}
              </div>

              <div className={styles.vocabTag}>{currentVocab.tag}</div>
              <div className={styles.vocabPinyin}>{currentVocab.pinyin}</div>
              <div className={styles.flipHint}>✨ Click để lật xem nghĩa</div>
              
              <button 
                className={styles.volumeBtnMain} 
                onClick={(e) => handleSpeak(currentVocab.hanzi, e)}
              >
                <Volume2 size={24} />
              </button>
            </div>

            {/* Back Side: Meaning & Example */}
            <div className={styles.flipCardBack}>
              <div className={styles.vocabMeaningLarge}>{currentVocab.meaning}</div>
              {currentVocab.example && (
                <div className={`${styles.vocabExampleBox} sketch-cross`}>
                  <div className={styles.exPinyin}>{currentVocab.examplePinyin}</div>
                  <div className={styles.exHanzi}>{currentVocab.example}</div>
                  <div className={styles.exMeaning}>→ {currentVocab.exampleMeaning}</div>
                  <button className={styles.exVolumeBtn} onClick={e => e.stopPropagation()}><Volume2 size={16} /></button>
                </div>
              )}
              <div className={styles.flipHint}>✨ Click để quay lại</div>
            </div>

          </div>
        </div>

        {/* Flashcard Footer */}
        <div className={styles.fcFooter}>
          <button 
            className={`${styles.navBtn} sketch-cross`}
            onClick={handlePrev}
            style={{ opacity: currentIndex === 0 ? 0.5 : 1, pointerEvents: currentIndex === 0 ? 'none' : 'auto' }}
          >
            <ChevronLeft size={16} /> Trước
          </button>
          <div className={styles.actionBtns}>
            <button className={`${styles.actionBtn} ${styles.btnRed} sketch-cross`}>
              <X size={16} /> Chưa thuộc
            </button>
            <button className={`${styles.actionBtn} ${styles.btnGreen} sketch-cross`}>
              <Check size={16} /> Đã thuộc
            </button>
          </div>
          <button 
            className={`${styles.navBtn} sketch-cross`}
            onClick={handleNext}
            style={{ opacity: currentIndex === vocabs.length - 1 ? 0.5 : 1, pointerEvents: currentIndex === vocabs.length - 1 ? 'none' : 'auto' }}
          >
            Sau <ChevronRight size={16} />
          </button>
        </div>
      </div>
      )}

      {activeMode === 'quiz' && (
        <QuizMode vocabs={vocabs} />
      )}

      {/* Study Modes */}
      <div className={styles.studyModesSection}>
        <h3 className={styles.sectionTitle}>Chọn chế độ học</h3>
        <div className={styles.modesScroll}>
          {studyModes.map(mode => (
            <button 
              key={mode.id}
              className={`${styles.modeBtn} ${activeMode === mode.id ? styles.modeActive : ''} sketch-cross`}
              onClick={() => setActiveMode(mode.id)}
            >
              <div className={styles.modeIcon}>
                {mode.id === 'flashcard' && '📚'}
                {mode.id === 'quiz' && '🎯'}
                {mode.id === 'typing' && '⌨️'}
                {mode.id === 'reading' && '📖'}
                {mode.id === 'listening' && '🎧'}
                {mode.id === 'hanzi_dance' && '🎵'}
                {mode.id === 'arena' && '⚔️'}
                <span className={styles.modeName}>{mode.title}</span>
              </div>
              <div className={`${styles.modeStatus} sketch-cross`}>{mode.status}</div>
            </button>
          ))}
        </div>
      </div>

      {/* List Header */}
      <div className={styles.listHeader}>
        <div className={styles.listActions}>
          <button className={`${styles.listActionBtn} sketch-cross`}><Printer size={14} /> In file</button>
          <button className={`${styles.listActionBtn} ${styles.btnYellow} sketch-cross`}><Star size={14} /> Thêm cả bài vào ôn tập</button>
        </div>
      </div>

      <div className={styles.vocabGrid}>
        {vocabs.map((vocab, idx) => (
          <div key={vocab.id} className={`${styles.vocabCard} sketch-cross`}>
            <div className={styles.vcardTop}>
              <div className={styles.vcardLeft}>
                <span className={styles.vcardNum}>{idx + 1}.</span>
                <div className={styles.vcardHanziArea}>
                  <div className={styles.vcardHanzi}>{vocab.hanzi}</div>
                  <div className={styles.vcardTag}>{vocab.tag}</div>
                </div>
              </div>
              <div className={styles.vcardRight}>
                <div className={styles.vcardPinyin}>{vocab.pinyin}</div>
                <div className={styles.vcardMeaning}>{vocab.meaning}</div>
              </div>
              <div className={styles.vcardTools}>
                <button><Flag size={16} /></button>
                <button><Star size={16} /></button>
                <button onClick={() => handleSpeak(vocab.hanzi)}><Volume2 size={16} /></button>
              </div>
            </div>
            {vocab.example && (
              <div className={styles.vcardBottom}>
                <div className={styles.vexampleBlock}>
                  <div className={styles.vexPinyin}>{vocab.examplePinyin}</div>
                  <div className={styles.vexHanzi}>{vocab.example}</div>
                  <div className={styles.vexMeaning}>→ {vocab.exampleMeaning}</div>
                </div>
                <button className={styles.vexVolume}><Volume2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
