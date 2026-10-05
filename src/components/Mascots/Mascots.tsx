'use client';

import React from 'react';
import styles from './Mascots.module.css';

interface MascotsProps {
  onHeartClick?: () => void;
  onRobotClick?: () => void;
}

export const HeartMascot: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <div
      className={styles.heartMascot}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title="Cổ vũ học tập! Nhấp để nhận năng lượng"
    >
      <svg width="48" height="48" viewBox="0 0 54 54" fill="none">
        {/* Floating Hearts */}
        <path
          d="M 10 12 C 10 7, 15 5, 17 9 C 19 5, 24 7, 24 12 C 24 18, 17 22, 17 22 C 17 22, 10 18, 10 12 Z"
          fill="#e53935"
          stroke="#222"
          strokeWidth="1.2"
        />
        <path
          d="M 38 8 C 38 4, 42 2, 44 5 C 46 2, 50 4, 50 8 C 50 13, 44 16, 44 16 C 44 16, 38 13, 38 8 Z"
          fill="#e53935"
          stroke="#222"
          strokeWidth="1.2"
        />
        <path
          d="M 44 32 C 44 28, 48 26, 50 29 C 52 26, 56 28, 56 32 C 56 36, 50 39, 50 39 C 50 39, 44 36, 44 32 Z"
          fill="#e53935"
          stroke="#222"
          strokeWidth="1.2"
        />

        {/* Mascot Face */}
        <circle cx="28" cy="30" r="18" fill="#d82a24" stroke="#222" strokeWidth="2" />
        {/* Star */}
        <polygon
          points="20,20 22,25 27,25 23,28 25,33 20,30 15,33 17,28 13,25 18,25"
          fill="#ffd700"
        />
        {/* Eyes (happy curves) */}
        <path
          d="M 27 27 Q 31 23 35 27"
          stroke="#222"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 37 27 Q 41 23 45 27"
          stroke="#222"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Smile */}
        <path
          d="M 33 34 Q 37 39 41 34"
          stroke="#222"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Blushing cheeks */}
        <ellipse cx="28" cy="32" rx="2.5" ry="1.5" fill="#ff7979" opacity="0.8" />
        <ellipse cx="44" cy="32" rx="2.5" ry="1.5" fill="#ff7979" opacity="0.8" />
      </svg>
    </div>
  );
};

export const RobotMascot: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <div
      className={styles.robotMascot}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title="Trợ lý AI Nhai TOCFL - Hỏi đáp 24/7"
    >
      <svg width="60" height="54" viewBox="0 0 70 60" fill="none">
        {/* Flag Ball in Background */}
        <circle cx="50" cy="38" r="14" fill="#d82a24" stroke="#222" strokeWidth="2" />
        <polygon
          points="46,31 47,34 50,34 48,36 49,39 46,37 43,39 44,36 42,34 45,34"
          fill="#ffd700"
        />

        {/* AI Robot */}
        {/* Antenna */}
        <line x1="28" y1="12" x2="28" y2="4" stroke="#222" strokeWidth="2" />
        <circle cx="28" cy="3" r="2.5" fill="#4ea5f5" stroke="#222" strokeWidth="1.5" />

        {/* Head */}
        <rect
          x="12"
          y="12"
          width="32"
          height="25"
          rx="9"
          fill="#ffffff"
          stroke="#222"
          strokeWidth="2.2"
        />
        {/* Blue Visor / Screen */}
        <rect
          x="17"
          y="16"
          width="22"
          height="14"
          rx="5"
          fill="#2b7fd4"
          stroke="#222"
          strokeWidth="1.5"
        />
        {/* Cute Digital Eyes */}
        <circle cx="23" cy="23" r="2" fill="#ffffff" />
        <circle cx="33" cy="23" r="2" fill="#ffffff" />

        {/* Headphones on sides */}
        <rect x="9" y="18" width="4" height="10" rx="2" fill="#2b7fd4" stroke="#222" strokeWidth="1.5" />
        <rect x="43" y="18" width="4" height="10" rx="2" fill="#2b7fd4" stroke="#222" strokeWidth="1.5" />

        {/* Body */}
        <rect
          x="17"
          y="37"
          width="22"
          height="15"
          rx="5"
          fill="#ffffff"
          stroke="#222"
          strokeWidth="2"
        />
        {/* AI Badge on chest */}
        <text
          x="22"
          y="48"
          fill="#2b7fd4"
          fontSize="9"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          AI
        </text>

        {/* Mini Laptop */}
        <rect x="22" y="44" width="16" height="10" rx="1.5" fill="#333" stroke="#222" strokeWidth="1" />
        <rect x="20" y="52" width="20" height="3" rx="1" fill="#bbb" stroke="#222" strokeWidth="1" />
      </svg>
    </div>
  );
};
