import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Check, X, RotateCcw, ChevronRight, Eye, EyeOff, Zap } from 'lucide-react';
import styles from './ListeningMode.module.css';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';

interface ListeningModeProps {
  lessonId: string;
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

// Chuẩn hóa chuỗi so sánh: bỏ dấu câu, khoảng trắng thừa
const cleanText = (str: string) => {
  return str
    .replace(/[，。？！、“”‘’…,.?!:;]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
};

export const ListeningMode: React.FC<ListeningModeProps> = ({ lessonId }) => {
  const { t } = useLanguage();
  const [readings, setReadings] = useState<any[]>([]);
  const [currentQueue, setCurrentQueue] = useState<any[]>([]);
  const [wrongItems, setWrongItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showPinyinHint, setShowPinyinHint] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.85);
  const [isFinished, setIsFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sound effects
  const playSfx = (type: 'correct' | 'wrong') => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  useEffect(() => {
    const fetchReadings = async () => {
      const supabase = createClient();
      
      const { data: readingsData, error: err1 } = await supabase
        .from('readings')
        .select('*')
        .eq('lessonId', lessonId)
        .order('createdAt', { ascending: true });
        
      if (err1) console.error("Error fetching readings for listening:", err1);
      
      if (readingsData && readingsData.length > 0) {
        const readingIds = readingsData.map(r => r.id);
        const { data: answersData, error: err2 } = await supabase
          .from('readingAnswers')
          .select('*')
          .in('readingId', readingIds);
          
        let answersMap: Record<string, string> = {};
        if (answersData) {
          answersData.forEach(a => {
            answersMap[a.readingId] = a.answer;
          });
        } else {
          const { data: answersDataFallback } = await supabase
            .from('"readingAnswers"')
            .select('*')
            .in('readingId', readingIds);
          if (answersDataFallback) {
            answersDataFallback.forEach(a => {
              answersMap[a.readingId] = a.answer;
            });
          }
        }
        
        const merged = readingsData.map(r => {
          const ans = answersMap[r.id] || '';
          // Câu đầy đủ đã điền đáp án
          const fullSentence = r.question ? r.question.replace('____', ans) : '';
          return {
            ...r,
            answer: ans,
            fullSentence: fullSentence
          };
        });
        
        setReadings(merged);
        setCurrentQueue(merged);
      }
    };
    fetchReadings();
  }, [lessonId]);

  const currentItem = currentQueue[currentIndex];

  const handleSpeak = (rate = playbackSpeed) => {
    if (!currentItem?.fullSentence) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentItem.fullSentence);
    utterance.lang = 'zh-TW';
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  // Tự động phát âm khi chuyển sang câu mới
  useEffect(() => {
    if (currentItem) {
      setInputValue('');
      setStatus('idle');
      setShowPinyinHint(false);
      setTimeout(() => {
        handleSpeak(playbackSpeed);
        inputRef.current?.focus();
      }, 200);
    }
  }, [currentIndex, currentQueue]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || status !== 'idle') return;

    const target = currentItem.fullSentence;
    const isCorrect = cleanText(inputValue) === cleanText(target);

    if (isCorrect) {
      setStatus('correct');
      setCorrectCount(prev => prev + 1);
      playSfx('correct');
    } else {
      setStatus('wrong');
      setWrongItems(prev => {
        if (prev.find(item => item.id === currentItem.id)) return prev;
        return [...prev, currentItem];
      });
      playSfx('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex < currentQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetryAll = () => {
    setCurrentQueue(readings);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongItems([]);
    setIsFinished(false);
    setStatus('idle');
    setInputValue('');
  };

  const handleRetryWrong = () => {
    if (wrongItems.length === 0) return;
    setCurrentQueue(wrongItems);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongItems([]);
    setIsFinished(false);
    setStatus('idle');
    setInputValue('');
  };

  if (readings.length === 0) {
    return (
      <div className={`${styles.listeningContainer} sketch-box`} style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: 16 }}>Đang tải bài nghe chép câu...</p>
      </div>
    );
  }

  if (isFinished) {
    const accuracy = Math.round((correctCount / currentQueue.length) * 100) || 0;
    const wrongCount = currentQueue.length - correctCount;

    return (
      <div className={`${styles.listeningContainer} sketch-box`} style={{ alignItems: 'center', justifyContent: 'center', backgroundImage: 'url("/vietnam_watermark.svg")', backgroundSize: '60%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className={styles.resultScreen}>
          <div className={styles.resultMascot}>🎧</div>
          <h2 className={styles.resultTitle}>Hoàn thành luyện nghe!</h2>
          <p className={styles.resultSubtitle}>Bạn đã hoàn thành lượt nghe chép câu này</p>

          <div className={styles.resultStatsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: '#27ae60' }}>{correctCount}</span>
              <span className={styles.statLabel}>Đúng</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: '#eb5757' }}>{wrongCount}</span>
              <span className={styles.statLabel}>Chưa chính xác</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: '#2b7fd4' }}>{accuracy}%</span>
              <span className={styles.statLabel}>Độ chuẩn xác</span>
            </div>
          </div>

          <div className={styles.resultActionsRow}>
            {wrongItems.length > 0 && (
              <button 
                className={`${styles.actionBtn} ${styles.btnRetryWrong} sketch-cross`}
                onClick={handleRetryWrong}
              >
                <RotateCcw size={18} /> Làm lại {wrongItems.length} câu sai
              </button>
            )}
            <button 
              className={`${styles.actionBtn} ${styles.btnRetryAll} sketch-cross`}
              onClick={handleRetryAll}
            >
              <RotateCcw size={18} /> Làm lại tất cả
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.listeningContainer} sketch-box`}
      style={{
        backgroundImage: 'url("/vietnam_watermark.svg")',
        backgroundSize: '60%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.audioSpeedBtns}>
          <button 
            className={`${styles.speedBtn} ${playbackSpeed === 0.65 ? styles.speedActive : ''}`}
            onClick={() => { setPlaybackSpeed(0.65); handleSpeak(0.65); }}
            title="Nghe chậm"
          >
            0.65x 🐢
          </button>
          <button 
            className={`${styles.speedBtn} ${playbackSpeed === 0.85 ? styles.speedActive : ''}`}
            onClick={() => { setPlaybackSpeed(0.85); handleSpeak(0.85); }}
            title="Tốc độ vừa"
          >
            0.85x ⚡
          </button>
          <button 
            className={`${styles.speedBtn} ${playbackSpeed === 1.0 ? styles.speedActive : ''}`}
            onClick={() => { setPlaybackSpeed(1.0); handleSpeak(1.0); }}
            title="Tốc độ tự nhiên"
          >
            1.0x 🚀
          </button>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.counterBadge}>
            Câu {currentIndex + 1} / {currentQueue.length}
          </span>
        </div>
      </div>

      {/* Main Area */}
      <div className={styles.mainArea}>
        {/* Loa phát âm */}
        <div className={styles.speakerBox}>
          <button 
            type="button" 
            className={styles.speakerBtn} 
            onClick={() => handleSpeak()}
            title="Bấm để nghe lại"
          >
            <Volume2 size={40} strokeWidth={2.5} />
          </button>
        </div>

        {/* Nghĩa tiếng Việt gợi ý */}
        {currentItem?.vietnameseMeaning && (
          <div className={styles.meaningText}>
            💡 {currentItem.vietnameseMeaning}
          </div>
        )}

        {/* Nút bật/tắt gợi ý Pinyin */}
        {currentItem?.pinyin && (
          <div>
            <button 
              type="button" 
              className={styles.hintToggleBtn}
              onClick={() => setShowPinyinHint(!showPinyinHint)}
            >
              {showPinyinHint ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>{showPinyinHint ? 'Ẩn phiên âm Pinyin' : 'Gợi ý phiên âm Pinyin'}</span>
            </button>
            {showPinyinHint && (
              <div className={styles.pinyinHint}>
                {currentItem.pinyin.replace('____', currentItem.answer || '')}
              </div>
            )}
          </div>
        )}

        {/* Form nhập đáp án */}
        <form className={styles.inputForm} onSubmit={handleSubmit}>
          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              type="text"
              className={`${styles.inputField} ${
                status === 'correct' ? styles.inputCorrect : status === 'wrong' ? styles.inputWrong : ''
              }`}
              placeholder="Nghe và gõ lại câu chữ Hán vào đây..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={status !== 'idle'}
              autoFocus
            />
            {status === 'idle' && (
              <button type="submit" className={styles.submitBtn}>
                Kiểm tra
              </button>
            )}
          </div>
        </form>

        {/* Phản hồi kết quả */}
        {status !== 'idle' && (
          <div className={`${styles.feedbackSection} ${status === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong}`}>
            <div className={styles.feedbackHeader}>
              {status === 'correct' ? (
                <>
                  <Check size={20} strokeWidth={3} />
                  <span>Chính xác tuyệt đối! 🎉</span>
                </>
              ) : (
                <>
                  <X size={20} strokeWidth={3} />
                  <span>Chưa chính xác rồi! Hãy xem câu mẫu nhé:</span>
                </>
              )}
            </div>

            <div className={styles.targetSentence}>
              {currentItem.fullSentence}
            </div>
            {currentItem.pinyin && (
              <div className={styles.targetPinyin}>
                {currentItem.pinyin.replace('____', currentItem.answer || '')}
              </div>
            )}

            <div className={styles.nextBtnRow}>
              <button 
                type="button" 
                className={styles.nextBtn}
                onClick={handleNext}
                autoFocus
              >
                <span>Câu tiếp theo</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <div className={styles.footer}>
        <div className={styles.progressBarTrack}>
          <div 
            className={styles.progressBarFill}
            style={{ width: `${((currentIndex + 1) / currentQueue.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
