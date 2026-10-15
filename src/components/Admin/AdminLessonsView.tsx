'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  BookOpen,
  Layers,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Search,
  X,
  Check,
  ArrowLeft,
  ShieldCheck,
  BookA,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import styles from './AdminLessonsView.module.css';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export interface BookOption {
  id: string;
  bookName: string;
  bookSeriId: string;
  book_series?: {
    id: string;
    name: string;
  };
}

export interface SeriesOption {
  id: string;
  name: string;
  orderindex: number;
}

export interface LessonItem {
  id: string;
  lessonName: string;
  bookId: string;
  wordCount?: number;
  isLocked: boolean;
  createdAt?: string;
  updatedAt?: string;
  books?: {
    id: string;
    bookName: string;
    bookSeriId: string;
    book_series?: {
      id: string;
      name: string;
    };
  };
  vocabularies?: { count: number }[];
}

interface AdminLessonsViewProps {
  onBack?: () => void;
  initialBookId?: string;
  onNavigateToVocabularies?: (lessonId: string) => void;
}

export const AdminLessonsView: React.FC<AdminLessonsViewProps> = ({
  onBack,
  initialBookId,
  onNavigateToVocabularies
}) => {
  const { user: currentUser, isAdmin } = useUser();
  const { t } = useLanguage();

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [series, setSeries] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('all');
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || 'all');
  const [selectedLockFilter, setSelectedLockFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modal: Add / Edit Lesson
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [formLessonName, setFormLessonName] = useState('');
  const [formBookId, setFormBookId] = useState('');
  const [formIsLocked, setFormIsLocked] = useState(false);

  // Modal: Delete Lesson
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<LessonItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Lessons and dropdown data from Server API
  const fetchLessonsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/lessons');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.lessons)) {
        setLessons(data.lessons);
      }
      if (Array.isArray(data.books)) {
        setBooks(data.books);
      }
      if (Array.isArray(data.series)) {
        setSeries(data.series);
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách bài học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLessonsData();
    }
  }, [isAdmin]);

  // Keep selectedBookId in sync if initialBookId changes
  useEffect(() => {
    if (initialBookId) {
      setSelectedBookId(initialBookId);
    }
  }, [initialBookId]);

  // Dynamic book options for filter based on selectedSeriesId
  const availableBooksForFilter = useMemo(() => {
    if (selectedSeriesId === 'all') return books;
    return books.filter(b => b.bookSeriId === selectedSeriesId);
  }, [books, selectedSeriesId]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalLessons = lessons.length;
    const lockedCount = lessons.filter(l => l.isLocked).length;
    const unlockedCount = totalLessons - lockedCount;
    const uniqueBooksCount = new Set(lessons.map(l => l.bookId)).size;
    return { totalLessons, unlockedCount, lockedCount, uniqueBooksCount };
  }, [lessons]);

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        lesson.lessonName.toLowerCase().includes(q) ||
        lesson.books?.bookName.toLowerCase().includes(q) ||
        lesson.books?.book_series?.name.toLowerCase().includes(q);

      // 2. Series Filter
      const matchSeries =
        selectedSeriesId === 'all' ||
        lesson.books?.bookSeriId === selectedSeriesId ||
        lesson.books?.book_series?.id === selectedSeriesId;

      // 3. Book Filter
      const matchBook =
        selectedBookId === 'all' || lesson.bookId === selectedBookId;

      // 4. Lock Filter
      const matchLock =
        selectedLockFilter === 'all' ||
        (selectedLockFilter === 'unlocked' && !lesson.isLocked) ||
        (selectedLockFilter === 'locked' && lesson.isLocked);

      return matchSearch && matchSeries && matchBook && matchLock;
    });
  }, [lessons, searchQuery, selectedSeriesId, selectedBookId, selectedLockFilter]);

  // Fast toggle Lock status
  const handleToggleLock = async (lesson: LessonItem) => {
    const nextLocked = !lesson.isLocked;

    // Optimistic UI update
    setLessons(prev =>
      prev.map(l => (l.id === lesson.id ? { ...l, isLocked: nextLocked } : l))
    );

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_lock',
          id: lesson.id,
          isLocked: nextLocked
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật trạng thái khóa');

      showToast(
        nextLocked
          ? `Đã khóa bài học "${lesson.lessonName}" (yêu cầu VIP)!`
          : `Đã mở khóa miễn phí bài học "${lesson.lessonName}"!`
      );
    } catch (e: any) {
      // Revert optimistic update on error
      setLessons(prev =>
        prev.map(l => (l.id === lesson.id ? { ...l, isLocked: lesson.isLocked } : l))
      );
      alert(e.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // Open Modal: Add Lesson
  const handleOpenAddModal = () => {
    setEditingLesson(null);
    setFormLessonName('');
    // Default to currently selected book or first available book
    const defaultBook =
      selectedBookId !== 'all' ? selectedBookId : books[0]?.id || '';
    setFormBookId(defaultBook);
    setFormIsLocked(false);
    setIsEditModalOpen(true);
  };

  // Open Modal: Edit Lesson
  const handleOpenEditModal = (lesson: LessonItem) => {
    setEditingLesson(lesson);
    setFormLessonName(lesson.lessonName);
    setFormBookId(lesson.bookId);
    setFormIsLocked(Boolean(lesson.isLocked));
    setIsEditModalOpen(true);
  };

  // Save Add/Edit Lesson
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLessonName.trim()) {
      alert('Vui lòng nhập tên bài học!');
      return;
    }
    if (!formBookId) {
      alert('Vui lòng chọn cuốn sách cho bài học!');
      return;
    }

    setActionLoading(true);
    try {
      if (editingLesson) {
        // Update
        const res = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_lesson',
            id: editingLesson.id,
            lessonName: formLessonName.trim(),
            bookId: formBookId,
            isLocked: formIsLocked
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật bài học');

        showToast(`Đã lưu thay đổi cho bài học "${formLessonName}"!`);
        setIsEditModalOpen(false);
        fetchLessonsData();
      } else {
        // Create
        const res = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_lesson',
            lessonName: formLessonName.trim(),
            bookId: formBookId,
            wordCount: 0,
            isLocked: formIsLocked
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi thêm bài học mới');

        showToast(`Đã thêm bài học "${formLessonName}" thành công!`);
        setIsEditModalOpen(false);
        fetchLessonsData();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi thao tác bài học');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete Lesson
  const handleConfirmDelete = async () => {
    if (!deletingLesson) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/lessons?id=${encodeURIComponent(deletingLesson.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xóa bài học');

      showToast(`Đã xóa bài học "${deletingLesson.lessonName}"!`);
      setIsDeleteModalOpen(false);
      setDeletingLesson(null);
      fetchLessonsData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa bài học');
    } finally {
      setActionLoading(false);
    }
  };

  // Access Denied Screen
  if (!isAdmin) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.deniedCard} sketch-box`}>
          <span className={styles.deniedIcon}>🔒</span>
          <h2 className={styles.deniedTitle}>Khu Vực Quản Trị Viên</h2>
          <p className={styles.deniedDesc}>
            Trang này chỉ dành riêng cho tài khoản có vai trò <strong>Admin</strong>.
          </p>
          <button
            onClick={onBack || (() => (window.location.href = '/'))}
            className={styles.btnPrimary}
          >
            <ArrowLeft size={16} /> Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastNotification}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.titleWithBadge}>
            <h1 className={styles.title}>Quản Lý Bài Học</h1>
            <span className={styles.adminTag}>
              <ShieldCheck size={12} /> Admin
            </span>
          </div>
          <p className={styles.subtitle}>
            Quản trị danh sách các bài học (Lessons), phân quyền VIP/Miễn phí và liên kết giáo trình.
          </p>
        </div>

        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={fetchLessonsData}
            title="Tải lại dữ liệu bài học"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleOpenAddModal}
          >
            <Plus size={16} />
            <span>Thêm Bài Học Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <FolderKanban size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.totalLessons}</span>
            <span className={styles.statLabel}>Tổng số bài học</span>
          </div>
        </div>

        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            <Unlock size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.unlockedCount}</span>
            <span className={styles.statLabel}>Bài học Miễn phí</span>
          </div>
        </div>

        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
            <Lock size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.lockedCount}</span>
            <span className={styles.statLabel}>Bài học Khóa (VIP)</span>
          </div>
        </div>

        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <BookOpen size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.uniqueBooksCount}</span>
            <span className={styles.statLabel}>Cuốn sách có bài</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={`${styles.toolbarCard} sketch-box`}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm theo tên bài học, tên sách..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className={styles.filtersGroup}>
          {/* Series Filter */}
          <select
            className={styles.filterSelect}
            value={selectedSeriesId}
            onChange={e => {
              setSelectedSeriesId(e.target.value);
              setSelectedBookId('all'); // Reset book filter when series changes
            }}
          >
            <option value="all">📚 Tất cả Bộ giáo trình</option>
            {series.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Book Filter */}
          <select
            className={styles.filterSelect}
            value={selectedBookId}
            onChange={e => setSelectedBookId(e.target.value)}
          >
            <option value="all">📖 Tất cả Cuốn sách</option>
            {availableBooksForFilter.map(b => (
              <option key={b.id} value={b.id}>
                {b.bookName}
              </option>
            ))}
          </select>

          {/* Lock Filter */}
          <select
            className={styles.filterSelect}
            value={selectedLockFilter}
            onChange={e => setSelectedLockFilter(e.target.value as any)}
          >
            <option value="all">🔒 Tất cả Trạng thái</option>
            <option value="unlocked">🔓 Chỉ bài Miễn phí</option>
            <option value="locked">🔒 Chỉ bài Khóa (VIP)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className={`${styles.tableContainer} sketch-box`}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>#</th>
                <th>Tên Bài Học</th>
                <th>Giáo Trình & Sách</th>
                <th style={{ width: 130 }}>Từ vựng</th>
                <th style={{ width: 140 }}>Trạng thái</th>
                <th style={{ width: 130 }}>Ngày tạo</th>
                <th style={{ width: 120, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#2b7fd4' }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>Đang tải danh sách bài học...</p>
                  </td>
                </tr>
              ) : filteredLessons.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                    <FolderKanban size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                      Không tìm thấy bài học nào phù hợp với bộ lọc hiện tại.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLessons.map((lesson, idx) => {
                  const vocabCount =
                    lesson.vocabularies?.[0]?.count ?? lesson.wordCount ?? 0;
                  const seriesName =
                    lesson.books?.book_series?.name || 'Chưa gán bộ';
                  const bookName = lesson.books?.bookName || 'Chưa gán sách';

                  return (
                    <tr key={lesson.id}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#888' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div className={styles.lessonCell}>
                          <div className={styles.lessonIconWrap}>
                            <FolderKanban size={18} />
                          </div>
                          <div className={styles.lessonNameCol}>
                            <span className={styles.lessonName}>{lesson.lessonName}</span>
                            <span className={styles.lessonBookSub}>ID: {lesson.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.badgeGroup}>
                          <span className={styles.seriesBadge}>
                            <Layers size={11} /> {seriesName}
                          </span>
                          <span className={styles.bookBadge}>
                            <BookOpen size={11} /> {bookName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.countBadge}>
                          <BookA size={12} /> {vocabCount} từ vựng
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.lockBadge} ${
                            lesson.isLocked ? styles.lockLocked : styles.lockUnlocked
                          }`}
                          onClick={() => handleToggleLock(lesson)}
                          title="Click để đổi nhanh trạng thái khóa / mở khóa bài học"
                        >
                          {lesson.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                          <span>{lesson.isLocked ? 'VIP Khóa' : 'Miễn phí'}</span>
                        </button>
                      </td>
                      <td style={{ color: '#888', fontSize: 12 }}>
                        {lesson.createdAt
                          ? new Date(lesson.createdAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          {/* Sửa bài học */}
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleOpenEditModal(lesson)}
                            title="Sửa thông tin bài học"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Xóa bài học */}
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => {
                              setDeletingLesson(lesson);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Xóa bài học này"
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

      {/* ==================== MODAL: THÊM / SỬA BÀI HỌC ==================== */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
              </h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson}>
              {/* Chọn sách */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Thuộc Cuốn sách *</label>
                <select
                  className={styles.formInput}
                  value={formBookId}
                  onChange={e => setFormBookId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Chọn cuốn sách --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bookName} {b.book_series?.name ? `(${b.book_series.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên bài học */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên bài học *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ví dụ: Bài 1: Xin chào! / 第一課: 你好！"
                  value={formLessonName}
                  onChange={e => setFormLessonName(e.target.value)}
                  required
                />
              </div>

              {/* Tùy chọn khóa VIP */}
              <div
                className={styles.formGroup}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 14,
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  id="lockCheckbox"
                  checked={formIsLocked}
                  onChange={e => setFormIsLocked(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label
                  htmlFor="lockCheckbox"
                  className={styles.formLabel}
                  style={{ cursor: 'pointer', marginBottom: 0 }}
                >
                  Khóa bài học (Yêu cầu tài khoản VIP Premium để học)
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={actionLoading}
                >
                  <Check size={16} />
                  <span>{actionLoading ? 'Đang lưu...' : 'Lưu bài học'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: XÁC NHẬN XÓA ==================== */}
      {isDeleteModalOpen && deletingLesson && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#c23838' }}>
                Xác nhận xóa bài học
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
              Bạn có chắc chắn muốn xóa bài học <strong>"{deletingLesson.lessonName}"</strong> không?
              {deletingLesson.vocabularies?.[0]?.count ? (
                <span style={{ display: 'block', marginTop: 8, color: '#c23838', fontWeight: 700 }}>
                  ⚠️ Lưu ý: Bài học này đang chứa {deletingLesson.vocabularies[0].count} từ vựng.
                </span>
              ) : null}
            </p>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ backgroundColor: '#c23838', borderColor: '#801818' }}
                onClick={handleConfirmDelete}
                disabled={actionLoading}
              >
                <Trash2 size={16} />
                <span>{actionLoading ? 'Đang xóa...' : 'Xóa bài học'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
