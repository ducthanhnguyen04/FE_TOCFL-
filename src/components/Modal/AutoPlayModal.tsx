import React, { useState } from 'react';
import styles from './AutoPlayModal.module.css';
import { Play } from 'lucide-react';

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
  const [flipTime, setFlipTime] = useState(3);
  const [nextTime, setNextTime] = useState(2);
  const [listenVocab, setListenVocab] = useState(true);
  const [listenExample, setListenExample] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} sketch-box`} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Tự động phát thẻ</h2>

        <div className={styles.row}>
          <div className={styles.info}>
            <div className={styles.label}>Thời gian để lật thẻ</div>
            <div className={styles.subtext}>Hiện mặt trước bao lâu rồi lật sang mặt sau</div>
          </div>
          <div className={styles.controls}>
            <div className={styles.counter}>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setFlipTime(Math.max(1, flipTime - 1))}>-</button>
              <div className={`${styles.valueBox} sketch-cross`}>{flipTime}</div>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setFlipTime(flipTime + 1)}>+</button>
            </div>
            <span className={styles.unit}>giây</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.info}>
            <div className={styles.label}>Thời gian để sang thẻ mới</div>
            <div className={styles.subtext}>Xem mặt sau bao lâu rồi chuyển thẻ kế tiếp</div>
          </div>
          <div className={styles.controls}>
            <div className={styles.counter}>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setNextTime(Math.max(1, nextTime - 1))}>-</button>
              <div className={`${styles.valueBox} sketch-cross`}>{nextTime}</div>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setNextTime(nextTime + 1)}>+</button>
            </div>
            <span className={styles.unit}>giây</span>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.row}>
          <div className={styles.info}>
            <div className={styles.label}>Nghe từ vựng</div>
            <div className={styles.subtext}>Đọc xong từ mới bắt đầu đếm thời gian</div>
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
            <div className={styles.label}>Nghe câu ví dụ</div>
            <div className={styles.subtext}>Đọc xong câu ví dụ mới bắt đầu đếm thời gian</div>
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
            <div className={styles.label}>Số lần nghe lại</div>
            <div className={styles.subtext}>Đọc tuần tự đủ số lần rồi mới lật/sang thẻ</div>
          </div>
          <div className={styles.controls}>
            <div className={styles.counter}>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))}>-</button>
              <div className={`${styles.valueBox} sketch-cross`}>{repeatCount}</div>
              <button className={`${styles.btnMath} sketch-cross`} onClick={() => setRepeatCount(repeatCount + 1)}>+</button>
            </div>
            <span className={styles.unit}>lần</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={`${styles.btnCancel} sketch-cross`} onClick={onClose}>Hủy</button>
          <button className={`${styles.btnStart} sketch-cross`} onClick={() => {
            onStart({ flipTime, nextTime, listenVocab, listenExample, repeatCount });
          }}>
            <Play size={16} fill="#fff" /> Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
};
