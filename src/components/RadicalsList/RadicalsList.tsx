'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Play, Shuffle, Settings, Volume2, Printer, X, Filter, FileText, Check } from 'lucide-react';
import styles from './RadicalsList.module.css';
import { AutoPlayModal, AutoPlaySettings } from '../Modal/AutoPlayModal';
import { PracticeSheetModal } from '../Modal/PracticeSheetModal';
import { useLanguage } from '@/providers/LanguageProvider';
import { createClient } from '@/lib/supabase/client';

export const RadicalsList = () => {
  const { lang, t } = useLanguage();
  const [radicals, setRadicals] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlayModalOpen, setIsAutoPlayModalOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [selectedStroke, setSelectedStroke] = useState<number | 'all'>('all');
  
  const autoPlayRef = React.useRef<boolean>(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('handicrafts')
        .select('*')
        .order('stroke', { ascending: true })
        .order('id', { ascending: true });
        
      console.log('Supabase radicals fetch:', { data, error });
        
      if (data) {
        setRadicals(data);
      }
    };
    fetchData();
  }, []);

  const filteredRadicals = useMemo(() => {
    if (selectedStroke === 'all') return radicals;
    return radicals.filter(r => r.stroke === selectedStroke);
  }, [radicals, selectedStroke]);

  // Handle index out of bounds when filtering
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedStroke]);

  const currentRadical = filteredRadicals[currentIndex] || {};

  const getMeaning = (item: any) => {
    if (lang === 'en' && item.englishmeaning) return item.englishmeaning;
    if (lang === 'id' && item.indonesiameaning) return item.indonesiameaning;
    return item.vietnammeaning || '';
  };

  const handleNext = () => {
    if (currentIndex < filteredRadicals.length - 1) {
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
    if (!text || typeof window === 'undefined') return Promise.resolve();
    
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
          console.warn("TTS Error", err);
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'zh-TW';
          utterance.rate = 0.85;
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
    
    if (audioRef.current) {
      audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'; 
      audioRef.current.play().catch(() => {});
    }
    
    let currentIdx = currentIndex;
    
    while (autoPlayRef.current && currentIdx < filteredRadicals.length) {
      const vocab = filteredRadicals[currentIdx];
      setIsFlipped(false);
      
      for (let i = 0; i < settings.repeatCount; i++) {
        if (!autoPlayRef.current) break;
        if (settings.listenVocab) {
          await handleSpeak(vocab.name);
          if (i < settings.repeatCount - 1) {
            await new Promise(r => setTimeout(r, 600));
          }
        }
      }
      
      if (!autoPlayRef.current) break;
      
      if (settings.flipTime > 0) {
        setIsFlipped(true);
        if (settings.listenExample) {
          await handleSpeak(vocab.name);
        }
        await new Promise(r => setTimeout(r, settings.flipTime * 1000));
      } else {
        await new Promise(r => setTimeout(r, settings.nextTime * 1000));
      }
      
      if (!autoPlayRef.current) break;
      
      if (currentIdx < filteredRadicals.length - 1) {
        setSlideDirection('left');
        setIsFlipped(false);
        currentIdx++;
        setCurrentIndex(currentIdx);
      } else {
        setIsAutoPlaying(false);
        autoPlayRef.current = false;
        break;
      }
    }
  };

  const stopAutoPlay = () => {
    autoPlayRef.current = false;
    setIsAutoPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis.cancel();
  };

  useEffect(() => {
    return () => {
      autoPlayRef.current = false;
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isAutoPlaying) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setIsFlipped(prev => !prev);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAutoPlaying, filteredRadicals.length]);

  const uniqueStrokes = useMemo(() => {
    const strokes = new Set(radicals.map(r => r.stroke));
    return Array.from(strokes).sort((a, b) => a - b);
  }, [radicals]);

  return (
    <div className={styles.container}>
      <div className={styles.topNav}>
        <button className={styles.blackBtn} onClick={() => setIsPracticeModalOpen(true)}>
          <FileText size={18} />
          <span>Tạo file luyện viết ({filteredRadicals.length} bộ)</span>
        </button>
      </div>

      <div className={`${styles.flashcardContainer} sketch-box`} translate="no">
        {/* Flashcard Header */}
        <div className={styles.fcHeader}>
          <div className={styles.fcTabs}>
            <button 
              className={`${styles.fcTabBtn} ${styles.fcTabActive} sketch-cross`}
            >
              📚 Bộ thủ
            </button>
          </div>
          
          <div className={`${styles.fcCounter} sketch-cross`}>
            <span>{filteredRadicals.length > 0 ? currentIndex + 1 : 0}</span> <span>/</span> <span>{filteredRadicals.length}</span>
          </div>

          <div className={styles.fcControls}>
            <button className={`${styles.fcControlBtn} sketch-cross`}><RefreshCw size={14} /> <span>ZH → {lang.toUpperCase()}</span></button>
            <button 
              className={`${styles.fcControlBtn} sketch-cross`}
              onClick={() => isAutoPlaying ? stopAutoPlay() : setIsAutoPlayModalOpen(true)}
            >
              <Play size={14} fill={isAutoPlaying ? "#d82924" : "none"} stroke={isAutoPlaying ? "#d82924" : "currentColor"} /> 
              <span>{isAutoPlaying ? t('lesson.stop') : 'Tự động'}</span>
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
                {currentRadical.name && currentRadical.name.split('').map((char: string, idx: number) => (
                  <div key={idx} className={`${styles.hanziChar} sketch-box`}>
                    <div className={styles.hanziGridLines}>
                      <div className={styles.hline}></div>
                      <div className={styles.vline}></div>
                    </div>
                    <span>{char}</span>
                  </div>
                ))}
              </div>

              <div className={styles.vocabTag}><span>Bộ thủ</span></div>
              <div className={styles.vocabPinyin}><span>{currentRadical.pinyin}</span></div>
              <div className={styles.flipHint}><span>Click để lật xem nghĩa</span></div>
              
              <button 
                className={styles.volumeBtnMain} 
                onClick={(e) => handleSpeak(currentRadical.name, e)}
              >
                <Volume2 size={24} />
              </button>
            </div>

            {/* Back Side: Meaning & Example */}
            <div className={styles.flipCardBack}>
              <div className={styles.vocabSino}>
                <span>{currentRadical.vietnammeaning?.split(',')[0]?.trim().toUpperCase()}</span>
              </div>
              <div className={styles.vocabMeaningLarge}><span>{getMeaning(currentRadical)}</span></div>
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
            <ChevronLeft size={16} /> <span>Trước</span>
          </button>
          <div className={styles.actionBtns}>
            <button className={`${styles.actionBtn} ${styles.btnRed} sketch-cross`} onClick={handleNext}>
              <X size={16} /> <span>Chưa thuộc</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.btnGreen} sketch-cross`} onClick={handleNext}>
              <Check size={16} /> <span>Đã thuộc</span>
            </button>
          </div>
          <button 
            className={`${styles.navBtn} sketch-cross`}
            onClick={handleNext}
            style={{ opacity: currentIndex === filteredRadicals.length - 1 ? 0.5 : 1, pointerEvents: currentIndex === filteredRadicals.length - 1 ? 'none' : 'auto' }}
          >
            <span>Sau</span> <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {uniqueStrokes.map(stroke => {
        const strokeRadicals = radicals.filter(r => r.stroke === stroke);
        return (
          <React.Fragment key={`stroke-${stroke}`}>
            <div className={styles.strokeGroupHeader}>
              <div className={`${styles.strokeBadge} sketch-cross`}>{stroke} nét</div>
              <div className={styles.strokeCount}>
                {strokeRadicals.length} bộ
              </div>
            </div>
            
            <div className={styles.gridContainer}>
              {strokeRadicals.map((r, i) => (
                <div 
                  key={r.id} 
                  className={`${styles.gridItem} ${currentRadical.id === r.id ? styles.gridItemActive : ''} sketch-cross`}
                  onClick={() => {
                    const idx = filteredRadicals.findIndex(x => x.id === r.id);
                    if (idx !== -1) {
                      setCurrentIndex(idx);
                      setIsFlipped(false);
                      // Play pronunciation audio
                      handleSpeak(r.name);
                      // Scroll to top
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  <div className={styles.gridHanziBox}>{r.name}</div>
                  <div className={styles.gridInfo}>
                    <div className={styles.gridHeader}>
                      <span className={styles.gridName}>
                        {r.vietnammeaning?.split(',')[0]?.trim()}
                      </span>
                    </div>
                    <div className={styles.gridMeaning}>{getMeaning(r)}</div>
                  </div>
                </div>
              ))}
            </div>
          </React.Fragment>
        );
      })}

      <AutoPlayModal 
        isOpen={isAutoPlayModalOpen}
        onClose={() => setIsAutoPlayModalOpen(false)}
        onStart={startAutoPlay}
      />

      <PracticeSheetModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        items={filteredRadicals.map(r => ({
          char: r.name,
          pinyin: r.pinyin,
          meaning: getMeaning(r)
        }))}
      />
    </div>
  );
};
