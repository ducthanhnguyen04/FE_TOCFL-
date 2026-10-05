import React, { useEffect } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import styles from './PracticeSheetModal.module.css';

interface PracticeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockPracticeData = [
  { char: '新', pinyin: 'xīn', meaning: 'MỚI' },
  { char: '同學', pinyin: 'tóng xué', meaning: 'BẠN HỌC' },
  { char: '她', pinyin: 'tā', meaning: 'CÔ ẤY' },
  { char: '誰', pinyin: 'shéi', meaning: 'AI' },
  { char: '叫', pinyin: 'jiào', meaning: 'GỌI, GỌI LÀ' },
  { char: '姓', pinyin: 'xìng', meaning: 'HỌ' }
];

export const PracticeSheetModal: React.FC<PracticeSheetModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} sketch-cross`}>
        {/* Header (Not Printed) */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FileText size={20} />
            <span>Tạo file luyện viết</span>
          </div>
          <div className={styles.headerActions}>
            <button onClick={handlePrint} className={`${styles.printBtn} sketch-cross`}>
              <Printer size={16} />
              <span>In tài liệu</span>
            </button>
            <button onClick={onClose} className={`${styles.closeBtn} sketch-cross`}>
              <X size={16} />
              <span>Đóng</span>
            </button>
          </div>
        </div>

        {/* Body containing the A4 preview */}
        <div className={styles.modalBody}>
          <div className={`${styles.a4Paper} ${styles.printableArea} printableArea`}>
            {mockPracticeData.map((item, idx) => (
              <div key={idx} className={styles.wordBlock}>
                {/* Word Info Header */}
                <div className={styles.wordHeader}>
                  <div className={styles.wordTitleRow}>
                    <span className={styles.charBold}>{item.char}</span>
                    <span className={styles.pinyin}>({item.pinyin})</span>
                  </div>
                  <div className={styles.meaning}>{item.meaning}</div>
                </div>

                {/* 11-box Grid Row */}
                <div className={styles.gridRow}>
                  {Array.from({ length: 11 }).map((_, boxIdx) => (
                    <div key={boxIdx} className={styles.gridBox}>
                      {/* Only show the character placeholder if it's multiple chars, we might want to split them,
                          but according to screenshot "同學" has "同" and "學" interleaved. 
                          Wait! The screenshot shows "同 學 同 學 同 學..." 
                          Let's implement a simple repeating pattern! */}
                      <span className={styles.traceChar}>
                        {item.char.length > 1 
                          ? item.char[boxIdx % item.char.length] 
                          : item.char}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
