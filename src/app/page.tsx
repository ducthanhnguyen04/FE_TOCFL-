'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import {
  Header,
  Sidebar,
  MobileDrawer,
  HeroSection,
  HSKSection,
  Watermark,
  HeartMascot,
  RobotMascot,
  ChatWidget,
  CardDetailModal,
} from '@/components';
import { HSKLevelItem, MenuItem } from '@/types';

export default function Home() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState('home');
  const [selectedLevel, setSelectedLevel] = useState<HSKLevelItem | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSelectMenu = (item: MenuItem) => {
    setActiveMenuId(item.id);
    showToast(`Đã chọn mục: ${item.label}`);
  };

  const handleLoginClick = () => {
    showToast('Tính năng đăng nhập đang được đồng bộ!');
  };

  const handleJoinCommunity = () => {
    showToast('🎉 Đang mở nhóm Zalo/Facebook: "Nhai tiếng Trung mỗi ngày"!');
  };

  const handleLearnMore = () => {
    const el = document.getElementById('hsk-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCardClick = (item: HSKLevelItem) => {
    setSelectedLevel(item);
  };

  const handleBoostStreak = () => {
    setStreakCount((prev) => prev + 1);
    showToast('⚡ +1 Điểm siêng năng mỗi ngày! Cố lên nhé!');
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toastMessage && (
          <div className={styles.toast} role="status">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Top Header */}
      <Header
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
        streakCount={streakCount}
        onLoginClick={handleLoginClick}
      />

      {/* Body with Sidebar & Main Content */}
      <div className={styles.bodyLayout}>
        {/* Desktop Sidebar */}
        <Sidebar activeId={activeMenuId} onSelectMenu={handleSelectMenu} />

        {/* Mobile Navigation Drawer */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          activeId={activeMenuId}
          onSelectMenu={handleSelectMenu}
          onLoginClick={handleLoginClick}
        />

        {/* Scrollable Content Area */}
        <div className={styles.scrollArea}>
          <main className={styles.mainContent}>
            {/* Vietnam Watermark & Highlighter BG */}
            <Watermark />

            {/* Hero Greeting Section */}
            <HeroSection
              onLearnMore={handleLearnMore}
              onJoinCommunity={handleJoinCommunity}
            />

            {/* HSK 3.0 Section with Cards */}
            <HSKSection onCardClick={handleCardClick} />

            {/* Floating Sticker Mascots */}
            <HeartMascot onClick={handleBoostStreak} />
            <RobotMascot onClick={() => showToast('🤖 AI: "你好! Hôm nay bạn muốn học từ vựng nào?"')} />
          </main>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <ChatWidget />

      {/* Card Details Modal */}
      <CardDetailModal
        item={selectedLevel}
        onClose={() => setSelectedLevel(null)}
      />
    </div>
  );
}
