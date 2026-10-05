'use client';

import React from 'react';
import { X, BookOpen, Volume2 } from 'lucide-react';
import styles from './CardDetailModal.module.css';
import { TOCFLLevelItem } from '@/types';

interface CardDetailModalProps {
  item: TOCFLLevelItem | null;
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  // Sample vocabulary for each level
  const sampleVocabByLevel: Record<number, Array<{ hanzi: string; pinyin: string; meaning: string }>> = {
    1: [
      { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào' },
      { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'Cảm ơn' },
      { hanzi: '再见', pinyin: 'zàijiàn', meaning: 'Tạm biệt' },
      { hanzi: '吃', pinyin: 'chī', meaning: 'Ăn' },
    ],
    2: [
      { hanzi: '准备', pinyin: 'zhǔnbèi', meaning: 'Chuẩn bị' },
      { hanzi: '欢迎', pinyin: 'huānyíng', meaning: 'Hoan nghênh' },
      { hanzi: '开始', pinyin: 'kāishǐ', meaning: 'Bắt đầu' },
      { hanzi: '帮助', pinyin: 'bāngzhù', meaning: 'Giúp đỡ' },
    ],
    3: [
      { hanzi: '决定', pinyin: 'juédìng', meaning: 'Quyết định' },
      { hanzi: '检查', pinyin: 'jiǎnchá', meaning: 'Kiểm tra' },
      { hanzi: '习惯', pinyin: 'xíguàn', meaning: 'Thói quen' },
      { hanzi: '环境', pinyin: 'huánjìng', meaning: 'Môi trường' },
    ],
    4: [
      { hanzi: '坚持', pinyin: 'jiānchí', meaning: 'Kiên trì' },
      { hanzi: '鼓励', pinyin: 'gǔlì', meaning: 'Khích lệ' },
      { hanzi: '经验', pinyin: 'jīngyàn', meaning: 'Kinh nghiệm' },
      { hanzi: '幽默', pinyin: 'yōumò', meaning: 'Hài hước' },
    ],
    5: [
      { hanzi: '挑战', pinyin: 'tiǎozhàn', meaning: 'Thách thức' },
      { hanzi: '启发', pinyin: 'qǐfā', meaning: 'Gợi mở' },
      { hanzi: '核心', pinyin: 'héxīn', meaning: 'Cốt lõi' },
      { hanzi: '珍惜', pinyin: 'zhēnxī', meaning: 'Trân quý' },
    ],
    6: [
      { hanzi: '博大精深', pinyin: 'bódàjīngshēn', meaning: 'Uyên bác' },
      { hanzi: '循序渐进', pinyin: 'xúnxùjiànjìn', meaning: 'Tuần tự' },
      { hanzi: '见仁见智', pinyin: 'jiànrénjiànzhì', meaning: 'Tùy quan điểm' },
      { hanzi: '兢兢业业', pinyin: 'jīngjīngyèyè', meaning: 'Cẩn trọng' },
    ],
  };

  const currentSamples = sampleVocabByLevel[item.level] || sampleVocabByLevel[1];

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Đóng bảng chi tiết"
          >
            <X size={18} />
          </button>
          <h2 className={styles.modalTitle}>{item.title}</h2>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.statsBar}>
            <div className={styles.statItem}>📖 {item.wordCount} Từ vựng</div>
            {item.patternCount && (
              <div className={styles.statItem}>✍️ {item.patternCount} Mẫu câu</div>
            )}
            <div className={styles.statItem}>🎯 TOCFL 3.0</div>
          </div>

          <div className={styles.descriptionBox}>
            <p>{item.description}</p>
          </div>

          <div>
            <div className={styles.vocabPreviewTitle}>Từ vựng tiêu biểu:</div>
            <div className={styles.vocabSampleGrid} style={{ marginTop: '8px' }}>
              {currentSamples.map((v, i) => (
                <div key={i} className={styles.vocabTag}>
                  <div>
                    <span className={styles.vocabHanzi}>{v.hanzi}</span>
                    <span style={{ fontSize: '11px', color: '#777', marginLeft: '4px' }}>
                      ({v.pinyin})
                    </span>
                  </div>
                  <span className={styles.vocabMeaning}>{v.meaning}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => alert(`Bắt đầu học ${item.title}!`)}
            >
              <BookOpen size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Bắt đầu học ngay
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => alert(`Luyện nghe Shadowing cho ${item.title}!`)}
            >
              <Volume2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
