import React, { useState } from 'react';
import { Layers, PenTool, FileText } from 'lucide-react';
import styles from './HanziList.module.css';
import { PracticeSheetModal } from '../Modal/PracticeSheetModal';

interface LessonItem {
  id: number;
  title: string;
  vocabCount: number;
  isLocked: boolean;
}

interface HanziListProps {
  lessons: LessonItem[];
}

// Sample characters matching the screenshot layout
const charData = "你好王老师大家学生们您谢不客气同再见请问叫什么名字我是对起没关系事很高兴认识也人的中国法文这谁女朋友哪她泰喂姐工作还忙吗太想有多少个哥呢几口爸妈妹和儿子孩岁他今年天号月日星期休息会做饭面条饺一些菜下班新电脑真看喜欢它手机话明去超市买东西牛奶吃晚那边包非常米怎坐出租车安店现在点上午分课吧影院半里医钟后房间外只小猫桌漂亮病胡前椅本书第习白读唱歌听视狗玩杯售货员钱块水果斤便宜商衣";
const characters = charData.split('');

export const HanziList: React.FC<HanziListProps> = () => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  return (
    <div className={styles.hanziWrapper}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.sectionTitle}>
          {characters.length} chữ Hán mới trong cuốn này
        </div>
        
        <div className={styles.actionsGroup}>
          <button className={`${styles.actionBtn} ${styles.flashcardBtn} sketch-cross`}>
            <Layers size={14} />
            <span>Flashcard</span>
          </button>
          <button className={`${styles.actionBtn} sketch-cross`}>
            <PenTool size={14} />
            <span>Luyện viết</span>
          </button>
          <button 
            className={`${styles.actionBtn} sketch-cross`}
            onClick={() => setIsPrintModalOpen(true)}
          >
            <FileText size={14} />
            <span>Tạo file</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className={`${styles.gridContainer} sketch-cross`}>
        <div className={styles.grid}>
          {characters.map((char, index) => (
            <div key={index} className={styles.charBox}>
              {char}
            </div>
          ))}
        </div>
      </div>

      <PracticeSheetModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
      />
    </div>
  );
};
