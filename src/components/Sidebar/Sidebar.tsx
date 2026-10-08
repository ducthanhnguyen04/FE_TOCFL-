'use client';

import React from 'react';
import styles from './Sidebar.module.css';
import { MENU_ITEMS } from '@/data/menuData';
import { MenuIcon } from './MenuIcon';
import { MenuItem } from '@/types';
import { useLanguage } from '@/providers/LanguageProvider';

interface SidebarProps {
  activeId?: string;
  onSelectMenu?: (item: MenuItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeId = 'home',
  onSelectMenu,
}) => {
  const { t } = useLanguage();
  const [openSubmenuId, setOpenSubmenuId] = React.useState<string | null>(null);
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openSubmenuId]);

  const handleMenuClick = (item: MenuItem) => {
    onSelectMenu?.(item);
    if (item.subItems) {
      setOpenSubmenuId((prev) => (prev === item.id ? null : item.id));
    } else {
      setOpenSubmenuId(null);
    }
  };

  return (
    <aside ref={sidebarRef} className={styles.sidebar} aria-label="Menu điều hướng chính">
      <ul className={styles.menuList}>
        {MENU_ITEMS.map((item) => {
          const isActive = item.id === activeId || item.subItems?.some(sub => sub.id === activeId);
          const isSubmenuOpen = openSubmenuId === item.id;
          
          return (
            <li key={item.id} className={styles.menuItem}>
              <button
                type="button"
                className={`${styles.menuBtn} ${isActive ? `${styles.menuBtnActive} sketch-cross` : ''}`}
                onClick={() => handleMenuClick(item)}
                title={item.label}
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

              <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0 }}>
                {isSubmenuOpen && item.subItems && (
                  <div className={`${styles.submenuFloating} sketch-cross`}>
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.id}
                        className={`${styles.subMenuItem} ${
                          activeId === sub.id ? styles.subMenuItemActive : ''
                        }`}
                        onClick={() => onSelectMenu?.(sub as MenuItem)}
                        style={{ position: 'relative' }}
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
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
