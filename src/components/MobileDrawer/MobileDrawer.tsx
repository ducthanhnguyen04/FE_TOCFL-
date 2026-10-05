'use client';

import React, { useEffect } from 'react';
import { X, LogIn } from 'lucide-react';
import styles from './MobileDrawer.module.css';
import { MENU_ITEMS } from '@/data/menuData';
import { MenuIcon } from '../Sidebar/MenuIcon';
import { MenuItem } from '@/types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeId?: string;
  onSelectMenu?: (item: MenuItem) => void;
  onLoginClick?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeId = 'home',
  onSelectMenu,
  onLoginClick,
}) => {
  const [openSubmenuId, setOpenSubmenuId] = React.useState<string | null>(null);

  const handleMenuClick = (item: MenuItem) => {
    if (item.subItems) {
      setOpenSubmenuId((prev) => (prev === item.id ? null : item.id));
    } else {
      onSelectMenu?.(item);
      onClose();
    }
  };

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.logoArea}>
            <span className={styles.chineseBadge}>汉语</span>
            <span className={styles.brandTitle}>NHAI! HSK</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>



        {/* Navigation List */}
        <ul className={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const isActive = item.id === activeId || item.subItems?.some(sub => sub.id === activeId);
            const isSubmenuOpen = openSubmenuId === item.id;
            
            return (
              <li key={item.id} className={styles.mobileMenuItem}>
                <button
                  type="button"
                  className={`${styles.menuItemBtn} ${isActive ? `${styles.menuItemActive} sketch-cross` : ''}`}
                  onClick={() => handleMenuClick(item)}
                >
                  <MenuIcon name={item.iconName} size={18} />
                  <span className={styles.menuLabel}>{item.label}</span>
                  {item.hasSubmenu && <span className={styles.chevron}>{isSubmenuOpen ? 'v' : '>'}</span>}
                </button>

                {isSubmenuOpen && item.subItems && (
                  <div className={styles.mobileSubmenu}>
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.id}
                        className={`${styles.mobileSubMenuItem} ${
                          activeId === sub.id ? styles.mobileSubMenuItemActive : ''
                        }`}
                        onClick={() => {
                          onSelectMenu?.(sub as MenuItem);
                          onClose();
                        }}
                      >
                        {sub.badge && (
                          <span className={styles.mobileSubBadge}>{sub.badge}</span>
                        )}
                        <MenuIcon name={sub.iconName} size={16} />
                        <span className={styles.mobileSubLabel}>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <p>© 2026 Nhai HSK • Học vui mỗi ngày</p>
        </div>
      </div>
    </div>
  );
};
