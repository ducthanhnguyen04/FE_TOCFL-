import React from 'react';
import styles from './Watermark.module.css';

export const Watermark: React.FC = () => {
  return (
    <div className={styles.watermarkContainer} aria-hidden="true">
      {/* Patriotic Watermark */}
      <div className={styles.vietnamWatermark}>
        <div className={styles.sloganLine1}>
          HOÀNG SA, TRƯỜNG SA LÀ CỦA VIỆT NAM
        </div>
        <div className={styles.sloganLine2}>
          西沙（黄沙）群岛、南沙（长沙）群岛属于越南
        </div>

        {/* Stylized Vietnam Map Silhouette with Archipelagos */}
        <div className={styles.mapSvgWrapper}>
          <svg
            viewBox="0 0 200 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Vietnam S-shape territory */}
            <path
              d="M 65 20 
                 C 75 18, 90 24, 92 35 
                 C 94 45, 82 52, 75 60 
                 C 68 68, 62 80, 68 95 
                 C 73 110, 85 125, 96 142 
                 C 107 158, 120 180, 115 198 
                 C 110 215, 92 230, 80 236 
                 C 68 242, 60 234, 62 225 
                 C 64 215, 78 205, 82 190 
                 C 86 175, 76 160, 65 145 
                 C 54 130, 46 112, 48 95 
                 C 50 78, 55 60, 52 45 
                 C 50 35, 55 22, 65 20 Z"
              fill="rgba(207, 64, 50, 0.22)"
              stroke="rgba(207, 64, 50, 0.45)"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
            {/* Hoang Sa (Paracel Islands) */}
            <g id="hoang-sa">
              <circle cx="145" cy="95" r="4" fill="rgba(207, 64, 50, 0.65)" />
              <circle cx="154" cy="92" r="3" fill="rgba(207, 64, 50, 0.65)" />
              <circle cx="150" cy="102" r="3.5" fill="rgba(207, 64, 50, 0.65)" />
              <circle cx="160" cy="98" r="2.5" fill="rgba(207, 64, 50, 0.65)" />
              <text
                x="142"
                y="85"
                fill="rgba(207, 64, 50, 0.75)"
                fontSize="8"
                fontFamily="sans-serif"
                fontWeight="bold"
              >
                Hoàng Sa
              </text>
            </g>
            {/* Truong Sa (Spratly Islands) */}
            <g id="truong-sa">
              <circle cx="155" cy="170" r="3.5" fill="rgba(207, 64, 50, 0.65)" />
              <circle cx="165" cy="178" r="4" fill="rgba(207, 64, 50, 0.65)" />
              <circle cx="148" cy="182" r="3" fill="rgba(207, 64, 50, 0.65)" />
              <circle cx="172" cy="188" r="3.2" fill="rgba(207, 64, 50, 0.65)" />
              <circle cx="160" cy="195" r="3" fill="rgba(207, 64, 50, 0.65)" />
              <text
                x="150"
                y="162"
                fill="rgba(207, 64, 50, 0.75)"
                fontSize="8"
                fontFamily="sans-serif"
                fontWeight="bold"
              >
                Trường Sa
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
