import React, { useState } from 'react';
import styles from './AutoPlayModal.module.css';
import { Play } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export interface AutoPlaySettings {
  flipTime: number;
  nextTime: number;
  listenVocab: boolean;
  listenExample: boolean;
  repeatCount: number;
}

interface AutoPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (settings: AutoPlaySettings) => void;
}

export const AutoPlayModal: React.FC<AutoPlayModalProps> = ({ isOpen, onClose, onStart }) => {
  const { t } = useLanguage();
  const [flipTime, setFlipTime] = useState(3);
  const [nextTime, setNextTime] = useState(2);
  const [listenVocab, setListenVocab] = useState(true);
  const [listenExample, setListenExample] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} sketch-box`} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>{t('auto.title')}</h2>

        <div className={styles.row}>
          <div className={styles.info}>
            <div className={styles.label}>{t('auto.flipTime')}</div>
            <div className={styles.subtext}>{t('auto.flipDesc')}</div>
          </div>
          <div className={styles.controls}>
            <div className={styles.counter}>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setFlipTime(Math.max(1, flipTime - 1))}>-</button>
              <div className={`${styles.valueBox} sketch-cross`}>{flipTime}</div>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setFlipTime(flipTime + 1)}>+</button>
            </div>
            <span className={styles.unit}>{t('auto.seconds')}</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.info}>
            <div className={styles.label}>{t('auto.nextTime')}</div>
            <div className={styles.subtext}>{t('auto.nextDesc')}</div>
          </div>
          <div className={styles.controls}>
            <div className={styles.counter}>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setNextTime(Math.max(1, nextTime - 1))}>-</button>
              <div className={`${styles.valueBox} sketch-cross`}>{nextTime}</div>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setNextTime(nextTime + 1)}>+</button>
            </div>
            <span className={styles.unit}>{t('auto.seconds')}</span>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.row}>
          <div className={styles.info}>
            <div className={styles.label}>{t('auto.listenVocab')}</div>
            <div className={styles.subtext}>{t('auto.listenVocabDesc')}</div>
          </div>
          <div className={styles.controls}>
            <div className={styles.toggleWrapper}>
              <div className={`${styles.toggle} ${listenVocab ? styles.on : ''} sketch-cross`} onClick={() => setListenVocab(!listenVocab)}>
                <div className={`${styles.knob} sketch-cross`}></div>
              </div>
            </div>
            <span className={styles.unit}></span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.info}>
            <div className={styles.label}>{t('auto.listenExample')}</div>
            <div className={styles.subtext}>{t('auto.listenExampleDesc')}</div>
          </div>
          <div className={styles.controls}>
            <div className={styles.toggleWrapper}>
              <div className={`${styles.toggle} ${listenExample ? styles.on : ''} sketch-cross`} onClick={() => setListenExample(!listenExample)}>
                <div className={`${styles.knob} sketch-cross`}></div>
              </div>
            </div>
            <span className={styles.unit}></span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.info}>
            <div className={styles.label}>{t('auto.repeat')}</div>
            <div className={styles.subtext}>{t('auto.repeatDesc')}</div>
          </div>
          <div className={styles.controls}>
            <div className={styles.counter}>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))}>-</button>
              <div className={`${styles.valueBox} sketch-cross`}>{repeatCount}</div>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setRepeatCount(repeatCount + 1)}>+</button>
            </div>
            <span className={styles.unit}>{t('auto.times')}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={`${styles.btnCancel} sketch-cross`} onClick={onClose}>{t('auto.cancel')}</button>
          <button className={`${styles.btnStart} sketch-cross`} onClick={() => {
            onStart({ flipTime, nextTime, listenVocab, listenExample, repeatCount });
          }}>
            <Play size={16} fill="#fff" /> {t('auto.start')}
          </button>
        </div>
      </div>
    </div>
  );
};
