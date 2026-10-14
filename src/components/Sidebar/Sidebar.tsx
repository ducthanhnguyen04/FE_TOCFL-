'use client';

import React from 'react';
import styles from './Sidebar.module.css';
import { MENU_ITEMS } from '@/data/menuData';
import { MenuIcon } from './MenuIcon';
import { MenuItem } from '@/types';
import { useLanguage } from '@/providers/LanguageProvider';
import { useUser } from '@/providers/UserProvider';

interface SidebarProps {
  activeId?: string;
  onSelectMenu?: (item: MenuItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeId = 'home',
  onSelectMenu,
}) => {
  const { t } = useLanguage();
  const { isAdmin } = useUser();
  const [openSubmenuId, setOpenSubmenuId] = React.useState<string | null>(null);
  const [submenuTop, setSubmenuTop] = React.useState<number>(0);
  const sidebarRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openSubmenuId &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setOpenSubmenuId(null);
      }
    };

    const handleResize = () => {
      if (openSubmenuId) {
        setOpenSubmenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [openSubmenuId]);

  const handleMenuClick = (item: MenuItem, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (item.subItems && item.subItems.length > 0) {
      if (openSubmenuId === item.id) {
        setOpenSubmenuId(null);
      } else {
        if (event) {
          const rect = event.currentTarget.getBoundingClientRect();
          setSubmenuTop(rect.top + rect.height / 2);
        }
        setOpenSubmenuId(item.id);
      }
    } else {
      onSelectMenu?.(item);
      setOpenSubmenuId(null);
    }
  };

  const handleScroll = () => {
    if (openSubmenuId) {
      setOpenSubmenuId(null);
    }
  };

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item.id === 'admin' && !isAdmin) return false;
    return true;
  });
  const mainItems = visibleItems.filter((item) => item.id !== 'settings');
  const settingsItem = visibleItems.find((item) => item.id === 'settings');
  const activeSubmenuItem = visibleItems.find((item) => item.id === openSubmenuId);

  return (
    <aside ref={sidebarRef} className={styles.sidebar} aria-label="Menu điều hướng chính">
      {/* Scrollable list for standard and future menu items */}
      <div className={styles.menuScrollArea} onScroll={handleScroll}>
        <ul className={styles.menuList}>
          {mainItems.map((item) => {
            const isActive = item.id === activeId || item.subItems?.some((sub) => sub.id === activeId);
            const isSubmenuOpen = openSubmenuId === item.id;

            return (
              <li key={item.id} className={styles.menuItem}>
                <button
                  type="button"
                  className={`${styles.menuBtn} ${isActive ? `${styles.menuBtnActive} sketch-cross` : ''}`}
                  onClick={(e) => handleMenuClick(item, e)}
                  title={t(`menu.${item.id}`) || item.label}
                >
                  <div className={styles.iconWrapper}>
                    <MenuIcon name={item.iconName} size={19} />
                  </div>
                  <div className={styles.labelWrapper}>
                    <span className={styles.label}>{t(`menu.${item.id}`) || item.label}</span>
                    {item.hasSubmenu && (
                      <span className={styles.arrow}>{isSubmenuOpen ? 'v' : '>'}</span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Pinned Bottom Settings button */}
      {settingsItem && (
        <div className={styles.bottomSection}>
          <button
            type="button"
            className={`${styles.menuBtn} ${settingsItem.id === activeId ? `${styles.menuBtnActive} sketch-cross` : ''}`}
            onClick={(e) => handleMenuClick(settingsItem, e)}
            title={t(`menu.${settingsItem.id}`) || settingsItem.label}
          >
            <div className={styles.iconWrapper}>
              <MenuIcon name={settingsItem.iconName} size={19} />
            </div>
            <div className={styles.labelWrapper}>
              <span className={styles.label}>{t(`menu.${settingsItem.id}`) || settingsItem.label}</span>
            </div>
          </button>
        </div>
      )}

      {/* Floating Submenu - Fixed to escape scroll boundaries */}
      {activeSubmenuItem && activeSubmenuItem.subItems && (
        <div
          className={`${styles.submenuFloating} sketch-cross`}
          style={{
            left: 'calc(var(--sidebar-width) + 8px)',
            top: `${submenuTop}px`,
            transform: 'translateY(-50%)',
          }}
        >
          {activeSubmenuItem.subItems.map((sub) => (
            <button
              key={sub.id}
              type="button"
              className={`${styles.subMenuItem} ${
                activeId === sub.id ? styles.subMenuItemActive : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectMenu?.(sub as MenuItem);
                setOpenSubmenuId(null);
              }}
              style={{ position: 'relative', zIndex: 9999, pointerEvents: 'auto', cursor: 'pointer' }}
            >
              {sub.badge && (
                <span className={styles.subMenuBadge}>{sub.badge}</span>
              )}
              <MenuIcon name={sub.iconName} size={20} />
              <span className={styles.subMenuLabel}>{t(`menu.${sub.id}`) || sub.label}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};
