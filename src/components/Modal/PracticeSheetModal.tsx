import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText } from 'lucide-react';
import styles from './PracticeSheetModal.module.css';
import { useLanguage } from '@/providers/LanguageProvider';

interface PracticeItem {
  char: string;
  pinyin: string;
  meaning: string;
}

interface PracticeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: PracticeItem[];
}

export const PracticeSheetModal: React.FC<PracticeSheetModalProps> = ({ isOpen, onClose, items = [] }) => {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className={`${styles.modalOverlay} print-modal`}>
      <div className={`${styles.modalContent} sketch-cross`}>
        {/* Header (Not Printed) */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FileText size={20} />
            <span>{t('practice.title')}</span>
          </div>
          <div className={styles.headerActions}>
            <button onClick={handlePrint} className={`${styles.printBtn} sketch-cross`}>
              <Printer size={16} />
              <span>{t('practice.print')}</span>
            </button>
            <button onClick={onClose} className={`${styles.closeBtn} sketch-cross`}>
              <X size={16} />
              <span>{t('practice.close')}</span>
            </button>
          </div>
        </div>

        {/* Body containing the A4 preview */}
        <div className={styles.modalBody}>
          <div className={`${styles.a4Paper} ${styles.printableArea} printableArea`}>
            {items.map((item) => (
              <div key={item.char} className={styles.wordBlock}>
                {/* Word Info Header */}
                <div className={styles.wordHeader}>
                  <div className={styles.wordTitleRow}>
                    <span className={styles.charBold}>{item.char}</span>
                    <span className={styles.pinyin}>({item.pinyin})</span>
                  </div>
                  <div className={styles.meaning}><span>{item.meaning}</span></div>
                </div>

                {/* 11-box Grid Row */}
                <div className={styles.gridRow}>
                  {Array.from({ length: 11 }).map((_, boxIdx) => (
                    <div key={`${item.char}-${boxIdx}`} className={styles.gridBox}>
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

  let portalRoot = document.getElementById('practice-modal-root');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'practice-modal-root';
    portalRoot.className = 'print-modal-root';
    document.body.appendChild(portalRoot);
  }

  return createPortal(modalContent, portalRoot);
};
