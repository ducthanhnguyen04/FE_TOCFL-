import React, { useState, useEffect } from 'react';
import { Volume2, Settings, HeartCrack, Check, X, ChevronRight, RotateCcw, Zap } from 'lucide-react';
import styles from './QuizMode.module.css';

interface Vocab {
  id: number | string;
  hanzi: string;
  pinyin: string;
  sino: string;
  meaning: string;
  tag: string;
  example?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
}

interface QuizModeProps {
  vocabs: Vocab[];
}

export const QuizMode: React.FC<QuizModeProps> = ({ vocabs }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizType, setQuizType] = useState<'pinyin' | 'vocab' | 'meaning'>('pinyin');
  const [selectedOptionId, setSelectedOptionId] = useState<number | string | null>(null);
  const [options, setOptions] = useState<{ id: number | string; text: string; isHanzi?: boolean }[]>([]);
  
  // Results State
  const [currentQuizQueue, setCurrentQuizQueue] = useState<Vocab[]>(vocabs);
  const [isFinished, setIsFinished] = useState(false);
  const [correctVocabs, setCorrectVocabs] = useState<Vocab[]>([]);
  const [wrongVocabs, setWrongVocabs] = useState<Vocab[]>([]);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  useEffect(() => {
    setCurrentQuizQueue(vocabs);
    setCurrentIndex(0);
    setCorrectVocabs([]);
    setWrongVocabs([]);
    setIsFinished(false);
  }, [vocabs]);

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

  React.useEffect(() => {
    if (!currentQuizQueue || currentQuizQueue.length === 0) return;
    const current = currentQuizQueue[currentIndex];
    if (!current) return;
    
    // Bốc ngẫu nhiên từ kho TẤT CẢ từ vựng gốc để làm đáp án sai (trừ đáp án đúng hiện tại)
    const wrongPool = vocabs.filter((v) => v.id !== current.id);
    wrongPool.sort(() => 0.5 - Math.random());
    const selectedWrong = wrongPool.slice(0, 3);
    
    const allOptions = [...selectedWrong, current].sort(() => 0.5 - Math.random());
    
    const formattedOptions = allOptions.map(opt => {
      let text = '';
      if (quizType === 'pinyin') text = opt.pinyin;
      else if (quizType === 'vocab') text = opt.hanzi;
      else text = opt.meaning;
      
      return {
        id: opt.id,
        text,
        isHanzi: quizType === 'vocab'
      };
    });
    
    setOptions(formattedOptions);
  }, [currentIndex, quizType, currentQuizQueue, vocabs]);

  const currentVocab = currentQuizQueue[currentIndex] || {};

  const handleOptionClick = (id: number | string) => {
    if (selectedOptionId !== null) return;
    setSelectedOptionId(id);
    setHasAnsweredCurrent(true);
    
    if (id === currentVocab.id) {
      playSound('correct');
      setCorrectVocabs(prev => [...prev, currentVocab]);
    } else {
      playSound('wrong');
      // Tránh duplicate nếu người dùng ấn Không biết xong lại ấn sai
      if (!wrongVocabs.find(v => v.id === currentVocab.id)) {
        setWrongVocabs(prev => [...prev, currentVocab]);
      }
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptionId(null);
    setHasAnsweredCurrent(false);
    if (currentIndex < currentQuizQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetryAll = () => {
    setCurrentQuizQueue(vocabs);
    setCurrentIndex(0);
    setCorrectVocabs([]);
    setWrongVocabs([]);
    setIsFinished(false);
    setSelectedOptionId(null);
    setHasAnsweredCurrent(false);
  };

  const handleRetryWrong = () => {
    if (wrongVocabs.length === 0) return;
    setCurrentQuizQueue(wrongVocabs);
    setCurrentIndex(0);
    setCorrectVocabs([]);
    setWrongVocabs([]);
    setIsFinished(false);
    setSelectedOptionId(null);
    setHasAnsweredCurrent(false);
  };

  if (isFinished) {
    const accuracy = Math.round((correctVocabs.length / currentQuizQueue.length) * 100) || 0;
    
    return (
      <div className={`${styles.quizContainer} sketch-box`} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.resultScreen}>
          <div className={styles.resultMascot}>😭</div>
          <h2 className={styles.resultTitle}>Hoàn thành!</h2>
          <p className={styles.resultSubtitle}>Bạn đã hoàn thành phần trắc nghiệm</p>
          
          <div className={styles.resultStatsRow}>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.correct}`}>{correctVocabs.length}</span>
              <span className={styles.statLabel}>Đúng</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.wrong}`}>{wrongVocabs.length}</span>
              <span className={styles.statLabel}>Sai</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.accuracy}`}>{accuracy}%</span>
              <span className={styles.statLabel}>Chính xác</span>
            </div>
          </div>
          
          <div className={`${styles.xpBadge} sketch-cross`}>
            <Zap size={18} fill="#000" />
            <span>+{correctVocabs.length} XP</span>
          </div>
          
          <div className={styles.resultActionsRow}>
            {wrongVocabs.length > 0 && (
              <button className={`${styles.actionBtn} ${styles.btnRetryWrong} sketch-cross`} onClick={handleRetryWrong}>
                <RotateCcw size={16} /> Làm lại từ sai ({wrongVocabs.length})
              </button>
            )}
            <button className={`${styles.actionBtn} ${styles.btnRetryAll} sketch-cross`} onClick={handleRetryAll}>
              <RotateCcw size={16} /> Làm lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.quizContainer} sketch-box`}>
      {/* Top Header */}
      <div className={styles.quizHeader}>
        <button className={styles.hintBtn}>
          <div className={`${styles.iconWrap} sketch-cross`}><Volume2 size={16} /></div>
          <span>Bí quá thì nghe</span>
        </button>

        <div className={styles.headerRight}>
          <div className={`${styles.modeToggles} sketch-cross`}>
            <button 
              className={`${styles.modeBtn} ${quizType === 'pinyin' ? styles.modeActive : ''}`}
              onClick={() => setQuizType('pinyin')}
            >
              Cách đọc
            </button>
            <button 
              className={`${styles.modeBtn} ${quizType === 'vocab' ? styles.modeActive : ''}`}
              onClick={() => setQuizType('vocab')}
            >
              Từ vựng
            </button>
            <button 
              className={`${styles.modeBtn} ${quizType === 'meaning' ? styles.modeActive : ''}`}
              onClick={() => setQuizType('meaning')}
            >
              Ý nghĩa
            </button>
          </div>
          <button className={`${styles.settingsBtn} sketch-cross`}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Question Area */}
      <div className={styles.questionArea} key={`quiz-${currentVocab.id}-${quizType}`}>
        {quizType === 'pinyin' && (
          <div>
            <div className={styles.questionHanzi}>{currentVocab.hanzi}</div>
            <div className={styles.questionMeaning}>{currentVocab.meaning}</div>
          </div>
        )}
        {quizType === 'vocab' && (
          <div>
            <div className={styles.questionBigPinyin}>{currentVocab.pinyin}</div>
            <div className={styles.questionMeaning}>{currentVocab.meaning}</div>
          </div>
        )}
        {quizType === 'meaning' && (
          <div>
            <div className={styles.questionHanzi}>{currentVocab.hanzi}</div>
            <div className={styles.questionBigPinyin}>{currentVocab.pinyin}</div>
          </div>
        )}
      </div>

      <div className={styles.feedbackTextWrapper}>
        {selectedOptionId !== null && (
          <span className={selectedOptionId === currentVocab.id ? styles.feedbackCorrect : styles.feedbackIncorrect}>
            {selectedOptionId === currentVocab.id ? 'Tuyệt cà là vời!' : 'Đúng là muối bỏ biển mà :))'}
          </span>
        )}
      </div>

      {/* Options Grid */}
      <div className={styles.optionsGrid}>
        {options.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrectOption = opt.id === currentVocab.id;
          const showCorrect = selectedOptionId !== null && isCorrectOption;
          const showIncorrect = selectedOptionId !== null && isSelected && !isCorrectOption;

          let optionClass = styles.optionBtn;
          if (showCorrect) optionClass += ` ${styles.optionCorrect}`;
          else if (showIncorrect) optionClass += ` ${styles.optionIncorrect}`;
          else if (selectedOptionId !== null) optionClass += ` ${styles.optionDisabled}`;

          return (
            <button 
              key={opt.id} 
              className={`${optionClass} sketch-cross`}
              onClick={() => handleOptionClick(opt.id)}
            >
              <div 
                className={`${styles.optionNum} sketch-cross`} 
                style={{ 
                  border: showCorrect || showIncorrect ? 'none' : '',
                  width: showCorrect || showIncorrect ? 'auto' : '28px'
                }}
              >
                {showCorrect ? <Check size={20} strokeWidth={3} /> : showIncorrect ? <X size={20} strokeWidth={3} /> : idx + 1}
              </div>
              <div className={`${styles.optionText} ${opt.isHanzi ? styles.hanziText : ''}`}>{opt.text}</div>
            </button>
          );
        })}
      </div>

      {/* Bottom Area */}
      <div className={styles.quizFooter}>
        <div className={styles.progressCounter}>
          {currentIndex + 1} / {currentQuizQueue.length || 0}
        </div>
        <div className={styles.bottomRight}>
          {selectedOptionId !== null ? (
            <button className={`${styles.continueBtn} sketch-cross`} onClick={handleNextQuestion}>
              Tiếp tục <ChevronRight size={16} />
            </button>
          ) : (
            <button className={styles.dontKnowBtn} onClick={() => {
              if (selectedOptionId !== null) return;
              setSelectedOptionId('dont_know');
              setHasAnsweredCurrent(true);
              playSound('wrong');
              if (!wrongVocabs.find(v => v.id === currentVocab.id)) {
                setWrongVocabs(prev => [...prev, currentVocab]);
              }
            }}>
              <HeartCrack size={16} />
              <span>Không biết</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (at the very bottom edge inside the sketch-box) */}
      <div className={styles.progressBarWrapper}>
        <div className={styles.progressBarFill} style={{ width: `${((currentIndex + 1) / (currentQuizQueue.length || 1)) * 100}%` }}></div>
      </div>
    </div>
  );
};
