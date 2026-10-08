import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Play, Shuffle, Settings, Volume2, Flag, Star, Printer, X, Check } from 'lucide-react';
import styles from './LessonDetail.module.css';
import { QuizMode } from './QuizMode';
import { TypingMode } from './TypingMode';
import { AutoPlayModal, AutoPlaySettings } from '../Modal/AutoPlayModal';
import { useLanguage } from '@/providers/LanguageProvider';

interface LessonDetailProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
}

import { createClient } from '@/lib/supabase/client';

export const LessonDetail: React.FC<LessonDetailProps> = ({ courseId, lessonId, onBack }) => {
  const { lang, t } = useLanguage();
  
  const studyModes = [
    { id: 'flashcard', title: t('lesson.vocab'), status: t('lesson.unstudied') },
    { id: 'quiz', title: t('lesson.quiz'), status: t('lesson.unstudied') },
    { id: 'typing', title: t('lesson.typing'), status: t('lesson.unstudied') },
    { id: 'reading', title: t('lesson.reading'), status: t('lesson.unstudied') },
    { id: 'listening', title: t('lesson.listening'), status: t('lesson.unstudied') },
  ];

  const [activeTab, setActiveTab] = useState<'vocab' | 'example'>('vocab');
  const [activeMode, setActiveMode] = useState('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [vocabs, setVocabs] = useState<any[]>([]);
  const [isAutoPlayModalOpen, setIsAutoPlayModalOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = React.useRef<boolean>(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [lessonName, setLessonName] = useState(t('lesson.loading'));

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();
        
      if (lessonData) setLessonName(lessonData.lessonName);
      
      const { data: vocabData, error } = await supabase
        .from('vocabularies')
        .select(`
          *,
          examples (
            example,
            pinyin,
            vietnammeaning,
            englishmeaning,
            indonesiameaning
          )
        `)
        .eq('lessonId', lessonId)
        .order('createdAt', { ascending: true });
        
      if (error) {
        console.error("Supabase fetch error:", error);
      }
      
      if (vocabData) {
        const mappedVocabs = vocabData.map((v) => {
          const ex = Array.isArray(v.examples) ? v.examples[0] : v.examples;
          
          return {
            id: v.id,
            hanzi: v.vocabulary,
            pinyin: v.pinyin,
            vietnameseMeaning: v.vietnameseMeaning,
            englishMeaning: v.englishMeaning,
            indonesiaMeaning: v.indonesiaMeaning, // Giả sử bảng vocabularies cũng có cột này
            tag: 'Từ vựng', // Fallback tag since we don't have tags in db
            example: ex?.example || null,
            examplePinyin: ex?.pinyin || null,
            exampleVietnamMeaning: ex?.vietnammeaning || null,
            exampleEnglishMeaning: ex?.englishmeaning || null,
            exampleIndonesiaMeaning: ex?.indonesiameaning || null
          };
        });
        setVocabs(mappedVocabs);
        setCurrentIndex(0);
      }
    };
    fetchData();
  }, [lessonId]);

  const currentVocab = vocabs[currentIndex] || {};
  
  // Hàm trợ giúp lấy nghĩa theo ngôn ngữ đang chọn
  const getMeaning = (vocabItem: any) => {
    if (lang === 'en' && vocabItem.englishMeaning) return vocabItem.englishMeaning;
    if (lang === 'id' && vocabItem.indonesiaMeaning) return vocabItem.indonesiaMeaning;
    return vocabItem.vietnameseMeaning || vocabItem.meaning;
  };
  
  const getExampleMeaning = (vocabItem: any) => {
    if (lang === 'en' && vocabItem.exampleEnglishMeaning) return vocabItem.exampleEnglishMeaning;
    if (lang === 'id' && vocabItem.exampleIndonesiaMeaning) return vocabItem.exampleIndonesiaMeaning;
    return vocabItem.exampleVietnamMeaning;
  };

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

  const handleSpeak = (text: string, e?: React.MouseEvent): Promise<void> => {
    if (e) e.stopPropagation();
    
    if (!text || typeof window === 'undefined') {
      return Promise.resolve();
    }
    
    // Gọi qua API Proxy nội bộ để bypass hoàn toàn lỗi CORS và Apple Webkit chặn audio
    const url = `/api/tts?text=${encodeURIComponent(text)}`;
    
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }
    
    audio.src = url;
    audio.load();
    
    return new Promise((resolve) => {
      if (!audio) return resolve();
      
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Lỗi phát Audio, dùng giọng máy tính thay thế:", err);
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'zh-TW';
          utterance.rate = 0.85;
          
          const voices = window.speechSynthesis.getVoices();
          let bestVoice = voices.find(v => v.name.includes('HsiaoChen') || v.name.includes('HsiaoYu') || v.name.includes('Mei-Jia') || v.name.includes('Ting-Ting')); 
          if (!bestVoice) bestVoice = voices.find(v => v.lang === 'zh-TW');
          if (bestVoice) utterance.voice = bestVoice;

          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        });
      }
    });
  };

  const startAutoPlay = async (settings: AutoPlaySettings) => {
    setIsAutoPlayModalOpen(false);
    setIsAutoPlaying(true);
    autoPlayRef.current = true;
    
    // Unlock Audio cho iOS (phải play() đồng bộ với click)
    if (audioRef.current) {
      audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'; 
      audioRef.current.play().catch(() => {});
    }
    
    let currentIdx = currentIndex;
    
    while (autoPlayRef.current && currentIdx < vocabs.length) {
      const vocab = vocabs[currentIdx];
      setIsFlipped(false);
      
      for (let i = 0; i < settings.repeatCount; i++) {
        if (!autoPlayRef.current) break;
        if (settings.listenVocab) {
          await handleSpeak(vocab.hanzi);
          if (i < settings.repeatCount - 1) {
            await new Promise(r => setTimeout(r, 600)); // Nghỉ 0.6s giữa mỗi lần đọc
          }
        }
      }
      
      if (!autoPlayRef.current) break;
      await new Promise(r => setTimeout(r, settings.flipTime * 1000));
      
      if (!autoPlayRef.current) break;
      setIsFlipped(true);
      
      if (settings.listenExample && vocab.example) {
        for (let i = 0; i < settings.repeatCount; i++) {
          if (!autoPlayRef.current) break;
          // Ưu tiên đọc example (chữ Hán), nếu không có thì đọc Pinyin
          await handleSpeak(vocab.example);
          if (i < settings.repeatCount - 1) {
            await new Promise(r => setTimeout(r, 800)); // Nghỉ 0.8s giữa các câu ví dụ
          }
        }
      }
      
      if (!autoPlayRef.current) break;
      await new Promise(r => setTimeout(r, settings.nextTime * 1000));
      
      if (!autoPlayRef.current) break;
      currentIdx++;
      if (currentIdx < vocabs.length) {
        setSlideDirection('left');
        setCurrentIndex(currentIdx);
      }
    }
    
    setIsAutoPlaying(false);
    autoPlayRef.current = false;
  };

  const stopAutoPlay = () => {
    setIsAutoPlaying(false);
    autoPlayRef.current = false;
  };

  return (
    <div className={styles.lessonWrapper} style={{ animation: 'fadeIn 0.3s ease' }}>
      <audio ref={audioRef} style={{ display: 'none' }} playsInline preload="auto" />
      {/* Top Bar */}
      <div className={styles.topBar}>
        <button onClick={onBack} className={styles.backBtn}>
          <ChevronLeft size={16} />
          <span>{t('lesson.list')}</span>
        </button>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.lessonMeta}>
          <span className={`${styles.lessonBadge} sketch-box`}>{lessonName}</span>
          <span className={styles.vocabCount}>{vocabs.length} {t('lesson.vocabUnit')}</span>
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
        <p className={styles.subtitle}>{lessonName} — {t('lesson.hskVocab')}</p>
      </div>

      {/* Main Container based on active mode */}
      {activeMode === 'flashcard' && (
        <div key="flashcard" className={`${styles.flashcardContainer} sketch-box`}>
          {/* Flashcard Header */}
        <div className={styles.fcHeader}>
          <div className={styles.fcTabs}>
            <button 
              className={`${styles.fcTabBtn} ${activeTab === 'vocab' ? styles.fcTabActive : ''} sketch-cross`}
              onClick={() => setActiveTab('vocab')}
            >
              📚 {t('lesson.vocab')}
            </button>
          </div>
          
          <div className={`${styles.fcCounter} sketch-cross`} key={`counter-${currentIndex}`}>
            <span>{vocabs.length > 0 ? currentIndex + 1 : 0}</span> / <span>{vocabs.length}</span>
          </div>

          <div className={styles.fcControls}>
            <button className={`${styles.fcControlBtn} sketch-cross`}><RefreshCw size={14} /> ZH → {lang.toUpperCase()}</button>
            <button 
              className={`${styles.fcControlBtn} sketch-cross`}
              onClick={() => isAutoPlaying ? stopAutoPlay() : setIsAutoPlayModalOpen(true)}
            >
              <Play size={14} fill={isAutoPlaying ? "#d82924" : "none"} stroke={isAutoPlaying ? "#d82924" : "currentColor"} /> 
              {isAutoPlaying ? t('lesson.stop') : t('lesson.auto')}
            </button>
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

                  </div>
                ))}
              </div>

              <div className={styles.vocabTag}><span>{currentVocab.tag}</span></div>
              <div className={styles.vocabPinyin}><span>{currentVocab.pinyin}</span></div>
              <div className={styles.flipHint}><span>{t('lesson.hint')}</span></div>
              
              <button 
                className={styles.volumeBtnMain} 
                onClick={(e) => handleSpeak(currentVocab.hanzi, e)}
              >
                <Volume2 size={24} />
              </button>
            </div>

            {/* Back Side: Meaning & Example */}
            <div className={styles.flipCardBack}>
              <div className={styles.vocabMeaningLarge}><span>{getMeaning(currentVocab)}</span></div>
              {currentVocab.example && (
                <div className={`${styles.vocabExampleBox} sketch-cross`}>
                  <div className={styles.exPinyin}><span>{currentVocab.examplePinyin}</span></div>
                  <div className={styles.exHanzi}><span>{currentVocab.example}</span></div>
                  <div className={styles.exMeaning}><span>→ {getExampleMeaning(currentVocab)}</span></div>
                  <button className={styles.exVolumeBtn} onClick={e => { e.stopPropagation(); handleSpeak(currentVocab.example, e); }}><Volume2 size={16} /></button>
                </div>
              )}
              <div className={styles.flipHint}><span>✨ Click để quay lại</span></div>
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
            <ChevronLeft size={16} /> {t('lesson.prev')}
          </button>
          <div className={styles.actionBtns}>
            <button className={`${styles.actionBtn} ${styles.btnRed} sketch-cross`}>
              <X size={16} /> {t('lesson.notMemorized')}
            </button>
            <button className={`${styles.actionBtn} ${styles.btnGreen} sketch-cross`}>
              <Check size={16} /> {t('lesson.memorized')}
            </button>
          </div>
          <button 
            className={`${styles.navBtn} sketch-cross`}
            onClick={handleNext}
            style={{ opacity: currentIndex === vocabs.length - 1 ? 0.5 : 1, pointerEvents: currentIndex === vocabs.length - 1 ? 'none' : 'auto' }}
          >
            {t('lesson.next')} <ChevronRight size={16} />
          </button>
        </div>
      </div>
      )}

      {activeMode === 'quiz' && (
        <div key="quiz">
          <QuizMode vocabs={vocabs} />
        </div>
      )}
      
      {activeMode === 'typing' && (
        <div key="typing">
          <TypingMode vocabs={vocabs} />
        </div>
      )}

      {/* Study Modes */}
      <div className={styles.studyModesSection}>
        <h3 className={styles.sectionTitle}>{t('lesson.chooseMode')}</h3>
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
          <button className={`${styles.listActionBtn} sketch-cross`}><Printer size={14} /> {t('lesson.print')}</button>
          <button className={`${styles.listActionBtn} ${styles.btnYellow} sketch-cross`}><Star size={14} /> {t('lesson.addReview')}</button>
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
                <div className={styles.vcardMeaning}>{getMeaning(vocab)}</div>
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
                  <div className={styles.vexMeaning}>→ {getExampleMeaning(vocab)}</div>
                </div>
                <button className={styles.vexVolume} onClick={(e) => handleSpeak(vocab.example, e)}><Volume2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      <AutoPlayModal 
        isOpen={isAutoPlayModalOpen} 
        onClose={() => setIsAutoPlayModalOpen(false)} 
        onStart={startAutoPlay} 
      />
    </div>
  );
};
