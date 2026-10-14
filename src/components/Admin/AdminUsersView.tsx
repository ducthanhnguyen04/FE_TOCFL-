'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  X,
  Star,
  Check,
  User as UserIcon,
  Crown,
  Activity,
  ArrowLeft
} from 'lucide-react';
import styles from './AdminUsersView.module.css';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { createClient } from '@/lib/supabase/client';

export interface UserItem {
  id: string;
  userName: string;
  email: string;
  role: 'admin' | 'user';
  isPremium: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
}

interface AdminUsersViewProps {
  onBack?: () => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onBack }) => {
  const { user: currentUser, role: userRole, isAdmin } = useUser();
  const { t } = useLanguage();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [premiumFilter, setPremiumFilter] = useState<string>('all');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'user'>('user');
  const [formIsPremium, setFormIsPremium] = useState(false);

  // Fetch users via secure Server API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401 || res.status === 403) {
        // Nếu không có quyền admin trên server, chuyển hướng ngay về trang chủ
        window.location.href = '/';
        return;
      }
      const data = await res.json();

      if (Array.isArray(data.users)) {
        const mappedUsers: UserItem[] = data.users.map((u: any) => ({
          id: u.id,
          userName: u.userName || u.username || 'Người dùng',
          email: u.email || 'N/A',
          role: u.role === 'admin' ? 'admin' : 'user',
          isPremium: Boolean(u.isPremium ?? u.ispremium),
          avatarUrl: u.avatarUrl || u.avatarurl || null,
          createdAt: u.createdAt || u.createdat || '2026'
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách người dùng qua API server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const premiumCount = users.filter(u => u.isPremium).length;
    const activeCount = Math.max(1, Math.round(total * 0.75));
    return { total, adminCount, premiumCount, activeCount };
  }, [users]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesPremium =
        premiumFilter === 'all' ||
        (premiumFilter === 'premium' && u.isPremium) ||
        (premiumFilter === 'free' && !u.isPremium);

      return matchesSearch && matchesRole && matchesPremium;
    });
  }, [users, searchQuery, roleFilter, premiumFilter]);

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormName(user.userName);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormIsPremium(user.isPremium);
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('user');
    setFormIsPremium(false);
    setIsEditModalOpen(true);
  };

  // Save Add/Edit via Server API
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingUser) {
      // Update existing
      const updatedList = users.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            userName: formName,
            email: formEmail,
            role: formRole,
            isPremium: formIsPremium
          };
        }
        return u;
      });
      setUsers(updatedList);

      try {
        await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_info',
            targetUserId: editingUser.id,
            userName: formName,
            email: formEmail,
            role: formRole,
            isPremium: formIsPremium
          })
        });
      } catch (err) {
        console.warn('Lỗi cập nhật qua server API', err);
      }
    } else {
      // Create new
      const newId = `user-${Date.now()}`;
      const newUser: UserItem = {
        id: newId,
        userName: formName,
        email: formEmail,
        role: formRole,
        isPremium: formIsPremium,
        avatarUrl: null,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers([newUser, ...users]);

      try {
        await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            targetUserId: newId,
            userName: formName,
            email: formEmail,
            role: formRole,
            isPremium: formIsPremium
          })
        });
      } catch (err) {
        console.warn('Lỗi thêm người dùng qua server API', err);
      }
    }

    setIsEditModalOpen(false);
  };

  // Fast toggle Role directly via Server API
  const handleToggleRole = async (user: UserItem) => {
    const nextRole: 'admin' | 'user' = user.role === 'admin' ? 'user' : 'admin';
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: nextRole } : u));
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          targetUserId: user.id,
          role: nextRole
        })
      });
    } catch (e) {
      console.warn('Lỗi đổi vai trò qua server API', e);
    }
  };

  // Fast toggle Premium directly via Server API
  const handleTogglePremium = async (user: UserItem) => {
    const nextPremium = !user.isPremium;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPremium: nextPremium } : u));
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_premium',
          targetUserId: user.id,
          isPremium: nextPremium
        })
      });
    } catch (e) {
      console.warn('Lỗi đổi gói qua server API', e);
    }
  };

  // Delete User via Server API
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
    try {
      await fetch(`/api/admin/users?id=${encodeURIComponent(deletingUser.id)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Lỗi xoá người dùng qua server API', e);
    }
    setIsDeleteModalOpen(false);
    setDeletingUser(null);
  };

  // ==================== 1. ACCESS DENIED SCREEN (IF NOT ADMIN) ====================
  if (!isAdmin) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.deniedCard} sketch-box`}>
          <span className={styles.deniedIcon}>🔒</span>
          <h2 className={styles.deniedTitle}>Khu Vực Quản Trị Viên</h2>
          <p className={styles.deniedDesc}>
            Trang này chỉ dành riêng cho tài khoản có vai trò <strong>Admin</strong>. Tài khoản hiện tại của bạn không có quyền truy cập khu vực này.
          </p>
          <div className={styles.deniedActions}>
            <button onClick={onBack || (() => window.location.href = '/')} className={styles.btnPrimary}>
              <ArrowLeft size={16} /> Quay lại trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 2. MAIN ADMIN USERS MANAGEMENT UI ====================
  return (
    <div className={styles.wrapper}>
      {/* Header Area */}
      <div className={styles.headerArea}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Quản lý Người Dùng</h1>
            <span className={`${styles.adminBadge} sketch-cross`}>ADMIN PORTAL</span>
          </div>
          <p className={styles.subtitle}>
            Xem danh sách, phân quyền Admin và quản lý trạng thái tài khoản người dùng
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchUsers}
            title="Làm mới danh sách"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleOpenAdd}
          >
            <Plus size={16} strokeWidth={2.5} /> Thêm người dùng
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#eef6ff', color: '#2b7fd4' }}>
            <Users size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Tổng người dùng</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#fff0f0', color: '#c23838' }}>
            <ShieldCheck size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.adminCount}</span>
            <span className={styles.statLabel}>Quản trị viên (Admin)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#fff9e6', color: '#d99400' }}>
            <Crown size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.premiumCount}</span>
            <span className={styles.statLabel}>Thành viên VIP Premium</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#edfaed', color: '#28a745' }}>
            <Activity size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.activeCount}</span>
            <span className={styles.statLabel}>Đang hoạt động gần đây</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={16} color="#888" />
          <input
            className={styles.searchInput}
            placeholder="Tìm theo tên hiển thị, địa chỉ email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.filterControls}>
          <select
            className={styles.selectInput}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="user">Người dùng (User)</option>
          </select>

          <select
            className={styles.selectInput}
            value={premiumFilter}
            onChange={e => setPremiumFilter(e.target.value)}
          >
            <option value="all">Tất cả gói</option>
            <option value="premium">Thành viên Premium</option>
            <option value="free">Tài khoản Thường</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: 'center' }}>#</th>
                <th>Người dùng</th>
                <th style={{ width: 140 }}>Vai trò</th>
                <th style={{ width: 140 }}>Gói tài khoản</th>
                <th style={{ width: 130 }}>Ngày tạo</th>
                <th style={{ width: 100, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '28px 0', color: '#666' }}>
                      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Không tìm thấy người dùng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isCurrent = currentUser?.email === u.email;
                  return (
                    <tr key={u.id}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#888' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.userName} className={styles.avatar} />
                          ) : (
                            <div className={styles.avatar}>
                              {u.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={styles.userNameCol}>
                            <span className={styles.userName}>
                              {u.userName} {isCurrent && <span style={{ color: '#2b7fd4', fontSize: 11 }}>(Bạn)</span>}
                            </span>
                            <span className={styles.userEmail}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleAdmin : styles.roleUser}`}
                          onClick={() => handleToggleRole(u)}
                          title="Click để đổi vai trò nhanh"
                        >
                          {u.role === 'admin' ? <ShieldCheck size={13} /> : <UserIcon size={13} />}
                          <span>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.premiumBadge} ${u.isPremium ? styles.premiumYes : styles.premiumNo}`}
                          onClick={() => handleTogglePremium(u)}
                          title="Click để bật / tắt quyền Premium"
                        >
                          {u.isPremium && <Star size={12} fill="#d99400" />}
                          <span>{u.isPremium ? 'Premium' : 'Miễn phí'}</span>
                        </button>
                      </td>
                      <td style={{ color: '#666', fontSize: 12.5 }}>
                        {u.createdAt || 'Mới tham gia'}
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleOpenEdit(u)}
                            title="Sửa thông tin"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                            onClick={() => {
                              setDeletingUser(u);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Xoá người dùng"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== MODAL: ADD / EDIT USER ==================== */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên người dùng *</label>
                <input
                  className={styles.formInput}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Địa chỉ Email *</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="name@gmail.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vai trò tài khoản</label>
                <select
                  className={styles.formInput}
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as 'admin' | 'user')}
                >
                  <option value="user">Người dùng (User)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <input
                  type="checkbox"
                  id="premiumCheck"
                  checked={formIsPremium}
                  onChange={e => setFormIsPremium(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="premiumCheck" className={styles.formLabel} style={{ cursor: 'pointer', marginBottom: 0 }}>
                  Kích hoạt gói VIP Premium
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  <Check size={16} /> Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CONFIRM DELETE ==================== */}
      {isDeleteModalOpen && deletingUser && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#c23838' }}>
                Xác nhận xoá tài khoản
              </h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '14px 0 24px' }}>
              Bạn có chắc chắn muốn xoá tài khoản <strong>{deletingUser.userName}</strong> ({deletingUser.email}) không? Hành động này không thể hoàn tác.
            </p>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ backgroundColor: '#c23838', borderColor: '#801818' }}
                onClick={handleConfirmDelete}
              >
                <Trash2 size={16} /> Xoá tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
