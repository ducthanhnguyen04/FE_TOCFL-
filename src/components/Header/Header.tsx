'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, LogIn } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  onToggleMobileDrawer: () => void;
  streakCount?: number;
  onLoginClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileDrawer,
  streakCount = 0,
  onLoginClick,
}) => {
  return (
    <header className={styles.header}>
      {/* Left: Mobile Menu Toggle & Brand Logo */}
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.hamburgerBtn}
          onClick={onToggleMobileDrawer}
          aria-label="Mở menu điều hướng"
        >
          <div className={styles.hamburgerIcon}>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </div>
        </button>

        <Link href="/" className={styles.logoWrapper}>
          <div className={styles.chineseBadge}>汉语</div>
          <div className={styles.logoTextContainer}>
            <span className={styles.logoBrand}>NHAI!</span>
            <span className={styles.logoSub}>H.S.K</span>
          </div>
        </Link>
      </div>

      {/* Right: Streak & Login Button */}
      <div className={styles.rightSection}>
        <div className={styles.streakBadge} title="Chuỗi ngày học liên tục">
          <Zap className={styles.lightningIcon} />
          <span>{streakCount}</span>
        </div>

        <button
          type="button"
          className={styles.loginBtn}
          onClick={onLoginClick}
        >
          <LogIn className={styles.loginIcon} />
          <span>Đăng nhập</span>
        </button>
      </div>
    </header>
  );
};
