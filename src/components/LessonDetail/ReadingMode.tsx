import React, { useState, useEffect, useMemo } from 'react';
import { Volume2, Eye, EyeOff, Check, X, RotateCcw, Zap } from 'lucide-react';
import styles from './ReadingMode.module.css';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';

interface ReadingModeProps {
  lessonId: string;
  vocabs: any[];
}

let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

export const ReadingMode: React.FC<ReadingModeProps> = ({ lessonId, vocabs }) => {
  const { t } = useLanguage();
  const [readings, setReadings] = useState<any[]>([]);
  const [currentQueue, setCurrentQueue] = useState<any[]>([]);
  const [wrongReadings, setWrongReadings] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showMeaning, setShowMeaning] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    const fetchReadings = async () => {
      const supabase = createClient();
      
      // 1. Fetch readings
      const { data: readingsData, error: err1 } = await supabase
        .from('readings')
        .select('*')
        .eq('lessonId', lessonId)
        .order('createdAt', { ascending: true });
        
      if (err1) console.error("Error fetching readings:", err1);
      
      if (readingsData && readingsData.length > 0) {
        // 2. Fetch all reading answers for these readings
        const readingIds = readingsData.map(r => r.id);
        const { data: answersData, error: err2 } = await supabase
          .from('readingAnswers')
          .select('*')
          .in('readingId', readingIds);
          
        if (err2) {
          const { data: answersDataFallback } = await supabase
            .from('"readingAnswers"')
            .select('*')
            .in('readingId', readingIds);
            
          if (answersDataFallback) {
             const merged = readingsData.map(r => ({
               ...r,
               readingAnswers: answersDataFallback.filter(a => a.readingId === r.id)
             }));
             setReadings(merged);
             return;
          }
        }
        
        const merged = readingsData.map(r => ({
          ...r,
          readingAnswers: answersData ? answersData.filter(a => a.readingId === r.id) : []
        }));
        
        setReadings(merged);
        setCurrentQueue(merged);
      }
    };
    fetchReadings();
  }, [lessonId]);

  const currentReading = currentQueue[currentIndex];

  useEffect(() => {
    const answersArr = currentReading?.readingAnswers || currentReading?.readinganswers;
    if (currentReading && answersArr && answersArr.length > 0) {
      const correctAnswer = answersArr[0].answer;
      
      // Select 3 random incorrect answers from vocabs
      const otherVocabs = vocabs.map(v => v.hanzi).filter(v => v !== correctAnswer);
      const shuffledOthers = [...otherVocabs].sort(() => 0.5 - Math.random());
      const selectedOthers = shuffledOthers.slice(0, 3);
      
      const allOptions = [correctAnswer, ...selectedOthers];
      setOptions(allOptions.sort(() => 0.5 - Math.random()));
      setSelectedAnswer(null);
    }
  }, [currentReading, vocabs]);

  if (readings.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu đọc hiểu...</div>;
  }

  const handleRetryAll = () => {
    setCurrentQueue(readings);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongReadings([]);
    setIsFinished(false);
    setSelectedAnswer(null);
  };

  const handleRetryWrong = () => {
    if (wrongReadings.length === 0) return;
    setCurrentQueue(wrongReadings);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongReadings([]);
    setIsFinished(false);
    setSelectedAnswer(null);
  };

  if (isFinished) {
    const accuracy = Math.round((correctCount / currentQueue.length) * 100) || 0;
    const wrongCount = currentQueue.length - correctCount;

    return (
      <div className={`${styles.quizContainer} sketch-box`} style={{ alignItems: 'center', justifyContent: 'center', backgroundImage: 'url("/vietnam_watermark.svg")', backgroundSize: '60%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: '#F9F0DF' }}>
        <div className={styles.resultScreen}>
          <div className={styles.resultMascot}>🎉</div>
          <h2 className={styles.resultTitle}>Hoàn thành!</h2>
          <p className={styles.resultSubtitle}>Bạn đã hoàn thành phần Đọc hiểu</p>
          
          <div className={styles.resultStatsRow}>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.correct}`}>{correctCount}</span>
              <span className={styles.statLabel}>Đúng</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.wrong}`}>{wrongCount}</span>
              <span className={styles.statLabel}>Sai</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.accuracy}`}>{accuracy}%</span>
              <span className={styles.statLabel}>Chính xác</span>
            </div>
          </div>

          <div className={`${styles.xpBadge} sketch-cross`}>
            <Zap size={18} fill="#000" />
            <span>+{correctCount} XP</span>
          </div>

          <div className={styles.resultActionsRow}>
            {wrongCount > 0 && (
              <button 
                className={`${styles.actionBtn} ${styles.btnRetryWrong} sketch-cross`}
                onClick={handleRetryWrong}
              >
                <RotateCcw size={16} /> Làm lại từ sai ({wrongCount})
              </button>
            )}
            <button 
              className={`${styles.actionBtn} ${styles.btnRetryAll} sketch-cross`}
              onClick={handleRetryAll}
            >
              <RotateCcw size={16} /> Làm lại từ đầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answersArr = currentReading?.readingAnswers || currentReading?.readinganswers;
  const correctAnswer = answersArr?.[0]?.answer || '';

  const playSound = (type: 'correct' | 'wrong') => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
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

  const handleOptionSelect = (option: string) => {
    if (selectedAnswer !== null || !correctAnswer) return;
    
    setSelectedAnswer(option);
    if (option === correctAnswer) {
      playSound('correct');
      setCorrectCount(prev => prev + 1);
    } else {
      playSound('wrong');
      if (!wrongReadings.find(r => r.id === currentReading.id)) {
        setWrongReadings(prev => [...prev, currentReading]);
      }
    }
    
    // Auto next after 1.5s
    setTimeout(() => {
      if (currentIndex < currentQueue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

  const handleSpeak = () => {
    // Speak the correct full sentence (replacing ____ with the answer)
    const fullSentence = currentReading.question.replace('____', correctAnswer);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fullSentence);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.quizContainer} style={{ backgroundImage: 'url("/vietnam_watermark.svg")', backgroundSize: '60%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: '#F9F0DF' }}>
      <div className={styles.quizHeader}>
        <button className={styles.hintBtn} onClick={handleSpeak}>
          <div className={styles.iconWrap}>
            <Volume2 size={20} strokeWidth={2.5} />
          </div>
          <span>Bí quá thì nghe</span>
        </button>
        
        <div className={styles.headerRight}>
          <button 
            className={styles.settingsBtn} 
            onClick={() => setShowMeaning(!showMeaning)}
            style={{ backgroundColor: '#F2C94C', borderColor: '#333', borderRadius: 8, fontWeight: 800, padding: '8px 16px', gap: 8 }}
          >
            {showMeaning ? <Eye size={18} /> : <EyeOff size={18} />}
            Nghĩa
          </button>
        </div>
      </div>

      <div className={styles.questionArea} style={{ paddingTop: 0 }}>
        {currentReading.pinyin && (
          <div className={styles.questionSino} style={{ textTransform: 'none', fontSize: 20, marginBottom: 4 }}>
            {currentReading.pinyin}
          </div>
        )}
        <div className={styles.questionHanzi} style={{ fontSize: 52 }}>
          {currentReading.question}
        </div>
        
        <div className={styles.questionMeaning} style={{ minHeight: 24, fontSize: 16, fontStyle: 'italic', opacity: showMeaning ? 1 : 0 }}>
          {currentReading.vietnameseMeaning}
        </div>
      </div>

      <div className={styles.feedbackTextWrapper}>
        {selectedAnswer !== null && (
          <span className={selectedAnswer === correctAnswer ? styles.feedbackCorrect : styles.feedbackIncorrect}>
            {selectedAnswer === correctAnswer ? 'Tuyệt cà là vời!' : 'Đúng là muối bỏ biển mà :))'}
          </span>
        )}
      </div>

      <div className={styles.optionsGrid}>
        {options.map((option, idx) => {
          let btnClass = styles.optionBtn;
          const isCorrectOption = option === correctAnswer;
          const isSelected = selectedAnswer === option;
          const showCorrect = selectedAnswer !== null && isCorrectOption;
          const showIncorrect = selectedAnswer !== null && isSelected && !isCorrectOption;

          if (showCorrect) btnClass += ` ${styles.optionCorrect}`;
          else if (showIncorrect) btnClass += ` ${styles.optionIncorrect}`;
          else if (selectedAnswer !== null) btnClass += ` ${styles.optionDisabled}`;
          
          return (
            <button 
              key={idx} 
              className={btnClass}
              onClick={() => handleOptionSelect(option)}
              style={{ backgroundColor: '#FFF7E6', display: 'flex', justifyContent: 'center' }}
            >
              <div 
                className={styles.optionNum} 
                style={{ 
                  borderRadius: 4, 
                  marginRight: 'auto',
                  border: showCorrect || showIncorrect ? 'none' : '',
                  width: showCorrect || showIncorrect ? 'auto' : '28px'
                }}
              >
                {showCorrect ? <Check size={20} strokeWidth={3} /> : showIncorrect ? <X size={20} strokeWidth={3} /> : idx + 1}
              </div>
              <span className={styles.hanziText} style={{ fontSize: 24, margin: '0 auto' }}>{option}</span>
              <div style={{ width: 28, marginLeft: 'auto' }}></div>
            </button>
          );
        })}
      </div>

      <div className={styles.quizFooter}>
        <div className={styles.progressCounter}>
          {currentIndex + 1} / {currentQueue.length}
        </div>
        <div className={styles.bottomRight}>
          <button className={styles.dontKnowBtn} onClick={() => handleOptionSelect('Bỏ qua')}>
            Câu này bó tay
          </button>
        </div>
      </div>

      <div className={styles.progressBarWrapper}>
        <div 
          className={styles.progressBarFill} 
          style={{ width: `${((currentIndex + (selectedAnswer ? 1 : 0)) / currentQueue.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
