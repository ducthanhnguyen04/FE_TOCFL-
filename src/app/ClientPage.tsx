'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { createClient } from '@/lib/supabase/client';
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
  SettingsView,
  CourseDetail,
  LessonDetail,
  RadicalsList,
} from '@/components';
import { TOCFLLevelItem, MenuItem } from '@/types';
import { TOCFL_LEVELS } from '@/data/tocflData';
import { useRouter } from 'next/navigation';

export default function ClientPage({ courseId, lessonId, initialActiveMenuId = 'home' }: { courseId?: string; lessonId?: string; initialActiveMenuId?: string }) {
  const router = useRouter();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(initialActiveMenuId);
  const [books, setBooks] = useState<any[]>([]);
  
  useEffect(() => {

  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('books').select('*').order('bookName', { ascending: true });
      if (data) setBooks(data);
    };
    fetchBooks();
  }, []);

  const dynamicLevels = books.map((book, i) => {
    const baseLevel = TOCFL_LEVELS[i] || {
      level: i + 1,
      wordCount: 0,
      patternCount: 0,
      description: 'Chưa có mô tả'
    };
    
    return {
      ...baseLevel,
      id: book.id,
      title: book.bookName
    };
  });

  const derivedSelectedLevel = courseId ? dynamicLevels.find(x => x.id.toString() === courseId) : null;
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
    
    // Explicit route mapping for main features
    const routeMapping: Record<string, string> = {
      'home': '/',
      'radicals': '/radicals',
      'account_settings': '/settings'
    };

    if (routeMapping[item.id]) {
      router.push(routeMapping[item.id]);
    } else {
      // Show toast or alert for unimplemented features instead of 404
      alert('Tính năng đang được phát triển!');
    }
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
        onAccountSettingsClick={() => setActiveMenuId('account_settings')}
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

            {lessonId && courseId ? (
              <LessonDetail 
                courseId={courseId} 
                lessonId={lessonId} 
                onBack={() => router.push(`/course/${courseId}`)}
              />
            ) : derivedSelectedLevel ? (
              <CourseDetail
                item={derivedSelectedLevel}
                onBack={() => router.push('/')}
              />
            ) : activeMenuId === 'account_settings' ? (
              <SettingsView />
            ) : activeMenuId === 'radicals' ? (
              <RadicalsList />
            ) : (
              <>
                {/* Hero Greeting Section */}
                <HeroSection
                  onLearnMore={handleLearnMore}
                  onJoinCommunity={handleJoinCommunity}
                />

                {/* TOCFL 3.0 Section with Cards */}
                <TOCFLSection levels={dynamicLevels} onCardClick={handleCardClick} />
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

// Trigger HMR
