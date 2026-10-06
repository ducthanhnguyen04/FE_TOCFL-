import React, { useState, useEffect, useRef } from 'react';
import { Settings, Lightbulb, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import styles from './TypingMode.module.css';

interface Vocab {
  id: number | string;
  hanzi: string;
  pinyin: string;
  sino: string;
  meaning: string;
  tag: string;
}

interface TypingModeProps {
  vocabs: Vocab[];
}

const normalizePinyin = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[1-5]/g, "").toLowerCase().replace(/\s+/g, '');
};

const playSound = (type: 'correct' | 'wrong') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    }
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

export const TypingMode: React.FC<TypingModeProps> = ({ vocabs }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizType, setQuizType] = useState<'pinyin' | 'meaning' | 'hanzi'>('pinyin');
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentIndex(0);
    setInputValue('');
    setStatus('idle');
    setHintsUsed(0);
    setIsFinished(false);
  }, [vocabs]);

  const currentVocab = vocabs[currentIndex];

  const getTargetAnswer = () => {
    if (!currentVocab) return '';
    if (quizType === 'pinyin') return currentVocab.pinyin;
    if (quizType === 'hanzi') return currentVocab.hanzi;
    return currentVocab.meaning;
  };

  const checkAnswer = () => {
    if (!inputValue.trim()) return;
    
    const target = getTargetAnswer();
    let isCorrect = false;

    if (quizType === 'pinyin') {
      isCorrect = normalizePinyin(inputValue) === normalizePinyin(target);
    } else {
      isCorrect = inputValue.trim().toLowerCase() === target.trim().toLowerCase();
    }

    if (isCorrect) {
      setStatus('correct');
      playSound('correct');
    } else {
      setStatus('wrong');
      playSound('wrong');
      setTimeout(() => {
        setStatus(prev => prev === 'wrong' ? 'idle' : prev);
      }, 600);
    }
  };

  const handleNext = () => {
    if (currentIndex < vocabs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setInputValue('');
      setStatus('idle');
      setHintsUsed(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsFinished(true);
    }
  };

  const handleHint = () => {
    if (hintsUsed >= 3 || status === 'correct') return;
    setHintsUsed(prev => prev + 1);
    
    const target = getTargetAnswer();
    // Provide a partial hint
    const hintLength = Math.ceil(target.length * (hintsUsed + 1) / 3);
    setInputValue(target.substring(0, hintLength));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (status === 'correct') {
        handleNext();
      } else {
        checkAnswer();
      }
    }
  };

  if (!currentVocab) return null;

  if (isFinished) {
    return (
      <div className={`${styles.typingContainer} sketch-box`}>
        <div className={styles.resultScreen}>
          <div className={styles.resultMascot}>🎉</div>
          <h2 className={styles.resultTitle}>Hoàn thành!</h2>
          <p className={styles.resultSubtitle}>Bạn đã hoàn thành phần luyện gõ</p>
          
          <div className={styles.resultActionsRow}>
            <button className={`${styles.actionBtn} ${styles.btnCheck} sketch-cross`} onClick={() => {
              setIsFinished(false);
              setCurrentIndex(0);
              setInputValue('');
              setStatus('idle');
              setHintsUsed(0);
            }}>
              <RotateCcw size={16} /> Làm lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pinyinSlots = currentVocab.pinyin.split(' ').length || 1;

  return (
    <div className={`${styles.typingContainer} sketch-box`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={`${styles.modeToggles} sketch-cross`}>
          <button 
            className={`${styles.modeBtn} ${quizType === 'pinyin' ? styles.modeActive : ''}`}
            onClick={() => { setQuizType('pinyin'); setInputValue(''); setStatus('idle'); }}
          >
            Cách đọc
          </button>
          <button 
            className={`${styles.modeBtn} ${quizType === 'meaning' ? styles.modeActive : ''}`}
            onClick={() => { setQuizType('meaning'); setInputValue(''); setStatus('idle'); }}
          >
            Ý nghĩa
          </button>
          <button 
            className={`${styles.modeBtn} ${quizType === 'hanzi' ? styles.modeActive : ''}`}
            onClick={() => { setQuizType('hanzi'); setInputValue(''); setStatus('idle'); }}
          >
            Chữ Hán
          </button>
        </div>
        <button className={`${styles.settingsBtn} sketch-cross`}>
          <Settings size={16} />
        </button>
      </div>

      {/* Main Area */}
      <div className={styles.mainArea} key={`typing-${currentVocab.id}-${quizType}`}>
        {quizType === 'pinyin' && (
          <div>
            <div className={styles.displayWord}>{currentVocab.hanzi}</div>
            <div className={styles.displayMeaning}>{currentVocab.meaning}</div>
          </div>
        )}
        {quizType === 'meaning' && (
          <div>
            <div className={styles.displayWord}>{currentVocab.hanzi}</div>
            <div className={styles.displayMeaning}>{currentVocab.pinyin}</div>
          </div>
        )}
        {quizType === 'hanzi' && (
          <div>
            <div className={styles.displayWord} style={{ fontSize: '40px', fontFamily: 'inherit' }}>{currentVocab.pinyin}</div>
            <div className={styles.displayMeaning}>{currentVocab.meaning}</div>
          </div>
        )}

        <div className={styles.charSlots}>
          {Array.from({ length: quizType === 'pinyin' ? pinyinSlots : currentVocab.hanzi.length }).map((_, i) => (
            <div key={i} className={styles.slot}></div>
          ))}
        </div>

        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.typeInput} ${styles[status]} sketch-cross`}
            placeholder={quizType === 'pinyin' ? "Gõ pinyin, số là thanh điệu (ni3 -> nǐ)" : "Gõ đáp án của bạn..."}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setStatus('idle');
            }}
            onKeyDown={handleKeyDown}
            readOnly={status === 'correct'}
            autoFocus
          />
        </div>

        <div className={styles.actionsRow}>
          {status === 'correct' ? (
            <button className={`${styles.actionBtn} ${styles.btnNext} sketch-cross`} onClick={handleNext}>
              <CheckCircle2 size={18} /> Tiếp tục <ChevronRight size={18} />
            </button>
          ) : (
            <>
              <button 
                className={`${styles.actionBtn} ${styles.btnHint} sketch-cross`} 
                onClick={handleHint}
                disabled={hintsUsed >= 3}
                style={{ opacity: hintsUsed >= 3 ? 0.5 : 1 }}
              >
                <Lightbulb size={18} /> Gợi ý ({hintsUsed}/3)
              </button>
              <button className={`${styles.actionBtn} ${styles.btnCheck} sketch-cross`} onClick={checkAnswer}>
                <CheckCircle2 size={18} /> Kiểm tra
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.progressCounter}>
          {currentIndex + 1} / {vocabs.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBarWrapper}>
        <div className={styles.progressBarFill} style={{ width: `${((currentIndex + 1) / (vocabs.length || 1)) * 100}%` }}></div>
      </div>
    </div>
  );
};
