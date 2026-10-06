import React, { useState } from 'react';
import { Volume2, Settings, HeartCrack, Check, X, ChevronRight } from 'lucide-react';
import styles from './QuizMode.module.css';

interface Vocab {
  id: number;
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
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  const handleOptionClick = (id: number) => {
    if (selectedOptionId !== null) return;
    setSelectedOptionId(id);
  };

  const handleNextQuestion = () => {
    setSelectedOptionId(null);
    // Move to next question if we had real logic
    // setCurrentIndex(prev => Math.min(prev + 1, vocabs.length - 1));
  };

  const currentVocab = vocabs[currentIndex] || {
    hanzi: '不客气',
    pinyin: 'bú kèqi',
    sino: 'BẤT KHÁCH KHÍ',
    meaning: 'Không có gì, đừng khách sáo'
  };

  // Fake options based on quizType
  const getOptions = (): { id: number; text: string; isHanzi?: boolean }[] => {
    if (quizType === 'pinyin') {
      return [
        { id: 1, text: 'nǐmen' },
        { id: 2, text: 'tóngxué' },
        { id: 3, text: 'bú kèqi' },
        { id: 4, text: 'lǎoshī' },
      ];
    } else if (quizType === 'vocab') {
      return [
        { id: 1, text: '大家', isHanzi: true },
        { id: 2, text: '谢谢', isHanzi: true },
        { id: 3, text: '老师', isHanzi: true },
        { id: 4, text: currentVocab.hanzi, isHanzi: true }, // The right answer
      ];
    } else {
      return [
        { id: 1, text: 'Mọi người' },
        { id: 2, text: 'Cảm ơn' },
        { id: 3, text: 'Giáo viên' },
        { id: 4, text: currentVocab.meaning }, // The right answer
      ];
    }
  };

  const options = getOptions();

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
      <div className={styles.questionArea}>
        {quizType === 'pinyin' && (
          <>
            <div className={styles.questionHanzi}>{currentVocab.hanzi}</div>
            <div className={styles.questionMeaning}>{currentVocab.meaning}</div>
          </>
        )}
        {quizType === 'vocab' && (
          <>
            <div className={styles.questionBigPinyin}>{currentVocab.pinyin}</div>
            <div className={styles.questionMeaning}>{currentVocab.meaning}</div>
          </>
        )}
        {quizType === 'meaning' && (
          <>
            <div className={styles.questionHanzi}>{currentVocab.hanzi}</div>
            <div className={styles.questionBigPinyin}>{currentVocab.pinyin}</div>
          </>
        )}
      </div>

      {/* Feedback Text */}
      <div className={styles.feedbackTextWrapper}>
        {selectedOptionId !== null && (
          <span className={selectedOptionId === 4 ? styles.feedbackCorrect : styles.feedbackIncorrect}>
            {selectedOptionId === 4 ? 'Tuyệt cà là vời!' : 'Đúng là muối bỏ biển mà :))'}
          </span>
        )}
      </div>

      {/* Options Grid */}
      <div className={styles.optionsGrid}>
        {options.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrectOption = opt.id === 4; // Mocking id=4 as correct
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
          {currentIndex + 1} / 13
        </div>
        <div className={styles.bottomRight}>
          {selectedOptionId !== null ? (
            <button className={`${styles.continueBtn} sketch-cross`} onClick={handleNextQuestion}>
              Tiếp tục <ChevronRight size={16} />
            </button>
          ) : (
            <button className={styles.dontKnowBtn} onClick={() => handleOptionClick(3)}>
              <HeartCrack size={16} />
              <span>Không biết</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (at the very bottom edge inside the sketch-box) */}
      <div className={styles.progressBarWrapper}>
        <div className={styles.progressBarFill} style={{ width: '8%' }}></div>
      </div>
    </div>
  );
};
