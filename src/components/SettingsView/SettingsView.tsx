import React from 'react';
import { User } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import styles from './SettingsView.module.css';

export const SettingsView: React.FC = () => {
  const { user } = useUser();

  return (
    <section className={styles.settingsView}>
      <h1 className={styles.pageTitle}>Cài đặt</h1>

      <div className={`${styles.accountBox} sketch-box`}>
        <div className={styles.sectionHeader}>
          <User size={18} strokeWidth={2.5} />
          <span>Tài khoản</span>
        </div>

        {user ? (
          <div className={styles.userInfo}>
            <div className={`${styles.avatarWrapper} sketch-circle`}>
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
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user.user_metadata?.full_name || 'Người dùng'}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
        ) : (
          <div className={styles.notLoggedIn}>
            Vui lòng đăng nhập để xem thông tin tài khoản.
          </div>
        )}
      </div>
    </section>
  );
};
