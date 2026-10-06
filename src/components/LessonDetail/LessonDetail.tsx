import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Play, Shuffle, Settings, Volume2, Flag, Star, Printer, X, Check } from 'lucide-react';
import styles from './LessonDetail.module.css';
import { QuizMode } from './QuizMode';

interface LessonDetailProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
}

const mockVocabs = [
  {
    id: 1,
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    sino: 'NỄ HẢO',
    meaning: 'Xin chào',
    tag: 'Cụm từ',
    example: '李明，你好',
    examplePinyin: 'lǐ míng, nǐ hǎo',
    exampleMeaning: 'Chào Lý Minh'
  },
  {
    id: 2,
    hanzi: '王老师',
    pinyin: 'Wáng lǎoshī',
    sino: 'VƯƠNG LÃO SƯ',
    meaning: 'Cô Vương',
    tag: 'Danh từ',
    example: '王老师，您好',
    examplePinyin: 'wáng lǎoshī, nín hǎo',
    exampleMeaning: 'Xin chào cô Vương'
  },
  {
    id: 3,
    hanzi: '大家',
    pinyin: 'dàjiā',
    sino: 'ĐẠI GIA',
    meaning: 'Mọi người',
    tag: 'Đại từ',
    example: '大家好，我是新学生',
    examplePinyin: 'dàjiā hǎo, wǒ shì xīn xuéshēng',
    exampleMeaning: 'Chào mọi người, tôi là học sinh mới'
  },
  {
    id: 4,
    hanzi: '好',
    pinyin: 'hǎo',
    sino: 'HẢO',
    meaning: 'Tốt, khỏe',
    tag: 'Tính từ',
    example: '老师，您好',
    examplePinyin: 'lǎoshī, nín hǎo',
    exampleMeaning: 'Xin chào thầy'
  }
];

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

  const currentVocab = mockVocabs[currentIndex];

  const handleNext = () => {
    if (currentIndex < mockVocabs.length - 1) {
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
          <span className={`${styles.lessonBadge} sketch-box`}>Bài {lessonId}</span>
          <span className={styles.vocabCount}>13 từ vựng</span>
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
          <h1 className={styles.mainTitle}>Xin chào!</h1>
        </div>
        <p className={styles.subtitle}>Bài {lessonId} — Từ vựng HSK</p>
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
            {currentIndex + 1} / {mockVocabs.length}
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
                {currentVocab.hanzi.split('').map((char, idx) => (
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
              
              <button className={styles.volumeBtnMain} onClick={e => e.stopPropagation()}><Volume2 size={24} /></button>
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
            style={{ opacity: currentIndex === mockVocabs.length - 1 ? 0.5 : 1, pointerEvents: currentIndex === mockVocabs.length - 1 ? 'none' : 'auto' }}
          >
            Sau <ChevronRight size={16} />
          </button>
        </div>
      </div>
      )}

      {activeMode === 'quiz' && (
        <QuizMode vocabs={mockVocabs} />
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

      {/* Vocab Grid List */}
      <div className={styles.vocabGrid}>
        {mockVocabs.map((vocab, idx) => (
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
                <button><Volume2 size={16} /></button>
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
