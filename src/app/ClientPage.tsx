'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import {
  Header,
  Sidebar,
  MobileDrawer,
  HeroSection,
  TOCFLSection,
  Watermark,
  HeartMascot,
  RobotMascot,
  ChatWidget,
  LoginModal,
  SettingsModal,
  CourseDetail,
} from '@/components';
import { TOCFLLevelItem, MenuItem } from '@/types';
import { TOCFL_LEVELS } from '@/data/tocflData';
import { useRouter } from 'next/navigation';

export default function ClientPage({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState('home');
  const derivedSelectedLevel = courseId ? TOCFL_LEVELS.find(x => x.id === Number(courseId)) : null;
  const [streakCount, setStreakCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSelectMenu = (item: MenuItem) => {
    if (item.id === 'settings') {
      setIsSettingsModalOpen(true);
      return;
    }
    setActiveMenuId(item.id);
    showToast(`Đã chọn mục: ${item.label}`);
  };

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleJoinCommunity = () => {
    showToast('🎉 Đang mở nhóm Zalo/Facebook: "Nhai tiếng Đài Loan mỗi ngày"!');
  };

  const handleLearnMore = () => {
    const el = document.getElementById('tocfl-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCardClick = (item: TOCFLLevelItem) => {
    // If routing isn't working via Link, fallback here
    router.push(`/course/${item.id}`);
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
        onSettingsClick={() => setIsSettingsModalOpen(true)}
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

            {derivedSelectedLevel ? (
              <CourseDetail
                item={derivedSelectedLevel}
                onBack={() => router.push('/')}
              />
            ) : (
              <>
                {/* Hero Greeting Section */}
                <HeroSection
                  onLearnMore={handleLearnMore}
                  onJoinCommunity={handleJoinCommunity}
                />

                {/* TOCFL 3.0 Section with Cards */}
                <TOCFLSection onCardClick={handleCardClick} />
              </>
            )}

            {/* Floating Sticker Mascots */}
            <HeartMascot onClick={handleBoostStreak} />
            <RobotMascot onClick={() => showToast('🤖 AI: "你好! Hôm nay bạn muốn học từ vựng nào?"')} />
          </main>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <ChatWidget />



      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
