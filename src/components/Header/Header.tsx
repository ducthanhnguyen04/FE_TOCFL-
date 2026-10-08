'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Zap, LogIn, LogOut, Bell, Settings, FileText } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import styles from './Header.module.css';

interface HeaderProps {
  onToggleMobileDrawer: () => void;
  streakCount?: number;
  onLoginClick?: () => void;
  onAccountSettingsClick?: () => void;
}
export const Header: React.FC<HeaderProps> = ({
  onToggleMobileDrawer,
  streakCount = 0,
  onLoginClick,
  onAccountSettingsClick,
}) => {
  const { user, logout } = useUser();
  const { t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };
    if (showDropdown || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showNotifications]);

  const handleLogout = async () => {
    await logout();
  };

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
          <div className={styles.chineseBadge}>華語</div>
          <div className={styles.logoTextContainer}>
            <span className={styles.logoBrand}>NHAI!</span>
            <span className={styles.logoSub}>TOCFL</span>
          </div>
        </Link>
      </div>

      {/* Right: Streak & Login Button */}
      <div className={styles.rightSection}>
        <div className={styles.streakBadge} title={t('header.streakTitle')}>
          <Zap className={styles.lightningIcon} />
          <span>{streakCount}</span>
        </div>

        {user ? (
          <div className={styles.userActions}>
            <div className={styles.notifContainer} ref={notifRef}>
              <button 
                className={`${styles.bellBtn} sketch-cross`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={16} strokeWidth={2.5} />
              </button>
              
              {showNotifications && (
                <div className={`${styles.notifDropdown} sketch-box`}>
                  <div className={styles.notifHeader}>
                    {t('header.notifTitle')}
                  </div>
                  <div className={styles.notifBody}>
                    <Bell size={32} strokeWidth={1.5} className={styles.emptyBellIcon} />
                    <span className={styles.emptyText}>{t('header.noNotif')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.avatarContainer} ref={dropdownRef}>
              <div 
                className={`${styles.avatarWrapper} sketch-circle`} 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    className={styles.userAvatar}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={styles.defaultAvatar}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {showDropdown && (
                <div className={`${styles.dropdownMenu} sketch-box`}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownName}>{user.user_metadata?.full_name || t('header.defaultUser')}</span>
                    <span className={styles.dropdownEmail}>{user.email}</span>
                  </div>
                  <div className={styles.dropdownBody}>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setShowDropdown(false);
                        onAccountSettingsClick?.();
                      }}
                    >
                      <Settings size={18} strokeWidth={2} />
                      <span>{t('header.accountSettings')}</span>
                    </button>
                    <button className={styles.dropdownItem}>
                      <FileText size={18} strokeWidth={2} />
                      <span>{t('header.terms')}</span>
                    </button>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                      <LogOut size={18} strokeWidth={2} />
                      <span>{t('header.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles.loginBtn}
            onClick={onLoginClick}
          >
            <LogIn className={styles.loginIcon} />
            <span>{t('header.login')}</span>
          </button>
        )}
      </div>
    </header>
  );
};
