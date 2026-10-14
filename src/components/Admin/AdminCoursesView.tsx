'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  BookOpen,
  FolderKanban,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  ChevronDown,
  Search,
  X,
  Check,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  BookA,
  ListFilter
} from 'lucide-react';
import styles from './AdminCoursesView.module.css';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export interface BookItem {
  id: string;
  bookName: string;
  bookSeriId: string;
  createdAt?: string;
  updatedAt?: string;
  lessons?: { count: number }[];
  seriesName?: string;
}

export interface SeriesItem {
  id: string;
  name: string;
  description?: string;
  orderindex: number;
  createdat?: string;
  updatedat?: string;
  books?: BookItem[];
}

interface AdminCoursesViewProps {
  onBack?: () => void;
  onNavigateToLessons?: (bookId?: string) => void;
}

export const AdminCoursesView: React.FC<AdminCoursesViewProps> = ({ onBack, onNavigateToLessons }) => {
  const { user: currentUser, isAdmin } = useUser();
  const { t } = useLanguage();

  const [currentTab, setCurrentTab] = useState<'series' | 'books' | 'all'>('series');
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modals
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
  const [seriesName, setSeriesName] = useState('');
  const [seriesDesc, setSeriesDesc] = useState('');
  const [seriesOrder, setSeriesOrder] = useState<number>(1);

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [targetSeriesId, setTargetSeriesId] = useState<string>('');
  const [bookName, setBookName] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; type: 'series' | 'book' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all series and books from server API
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.series)) {
        setSeriesList(data.series);
        const initialExpanded: Record<string, boolean> = {};
        data.series.forEach((s: SeriesItem) => {
          initialExpanded[s.id] = true;
        });
        setExpandedSeries(initialExpanded);
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách giáo trình:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCourses();
    }
  }, [isAdmin]);

  // Toggle Accordion
  const toggleExpand = (seriesId: string) => {
    setExpandedSeries(prev => ({
      ...prev,
      [seriesId]: !prev[seriesId]
    }));
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalSeries = seriesList.length;
    let totalBooks = 0;
    let totalLessons = 0;

    seriesList.forEach(s => {
      const books = s.books || [];
      totalBooks += books.length;
      books.forEach(b => {
        const count = b.lessons?.[0]?.count || 0;
        totalLessons += count;
      });
    });

    return { totalSeries, totalBooks, totalLessons };
  }, [seriesList]);

  // Flattened Books for Books Table
  const allBooks: BookItem[] = useMemo(() => {
    return seriesList.flatMap(s => (s.books || []).map(b => ({ ...b, seriesName: s.name })));
  }, [seriesList]);

  // Filtered Series
  const filteredSeries = useMemo(() => {
    if (!searchQuery.trim()) return seriesList;
    const q = searchQuery.toLowerCase();

    return seriesList.filter(s => {
      const matchSeriesName = s.name.toLowerCase().includes(q);
      const matchSeriesDesc = (s.description || '').toLowerCase().includes(q);
      const matchBook = (s.books || []).some(b => b.bookName.toLowerCase().includes(q));
      return matchSeriesName || matchSeriesDesc || matchBook;
    });
  }, [seriesList, searchQuery]);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return allBooks;
    const q = searchQuery.toLowerCase();
    return allBooks.filter(b => b.bookName.toLowerCase().includes(q) || (b.seriesName || '').toLowerCase().includes(q));
  }, [allBooks, searchQuery]);

  // Open Series Modal (Add or Edit)
  const handleOpenSeriesModal = (series?: SeriesItem) => {
    if (series) {
      setEditingSeries(series);
      setSeriesName(series.name);
      setSeriesDesc(series.description || '');
      setSeriesOrder(series.orderindex || 1);
    } else {
      setEditingSeries(null);
      setSeriesName('');
      setSeriesDesc('');
      setSeriesOrder((seriesList.length || 0) + 1);
    }
    setIsSeriesModalOpen(true);
  };

  // Submit Series Form
  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim()) {
      alert('Vui lòng nhập tên bộ giáo trình!');
      return;
    }

    setActionLoading(true);
    try {
      const action = editingSeries ? 'update_series' : 'create_series';
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id: editingSeries?.id,
          name: seriesName.trim(),
          description: seriesDesc.trim(),
          orderindex: seriesOrder
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Có lỗi xảy ra');

      showToast(editingSeries ? 'Đã cập nhật bộ giáo trình!' : 'Đã tạo bộ giáo trình mới thành công!');
      setIsSeriesModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu bộ giáo trình');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Book Modal (Add or Edit)
  const handleOpenBookModal = (seriesId?: string, book?: BookItem) => {
    setTargetSeriesId(seriesId || seriesList[0]?.id || '');
    if (book) {
      setEditingBook(book);
      setBookName(book.bookName);
    } else {
      setEditingBook(null);
      setBookName('');
    }
    setIsBookModalOpen(true);
  };

  // Submit Book Form
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim()) {
      alert('Vui lòng nhập tên cuốn sách!');
      return;
    }
    if (!targetSeriesId) {
      alert('Vui lòng chọn Bộ giáo trình!');
      return;
    }

    setActionLoading(true);
    try {
      const action = editingBook ? 'update_book' : 'create_book';
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id: editingBook?.id,
          bookName: bookName.trim(),
          bookSeriId: targetSeriesId
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Có lỗi xảy ra');

      showToast(editingBook ? 'Đã đổi tên cuốn sách!' : 'Đã thêm cuốn sách mới vào bộ giáo trình!');
      setIsBookModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu cuốn sách');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Confirm Modal
  const handleConfirmDelete = (id: string, name: string, type: 'series' | 'book') => {
    setDeletingItem({ id, name, type });
    setIsDeleteModalOpen(true);
  };

  // Execute Delete
  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses?id=${encodeURIComponent(deletingItem.id)}&type=${deletingItem.type}`, {
        method: 'DELETE'
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Có lỗi xảy ra khi xóa');

      showToast(deletingItem.type === 'series' ? 'Đã xóa bộ giáo trình!' : 'Đã xóa cuốn sách!');
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa mục này!');
    } finally {
      setActionLoading(false);
    }
  };

  // Non-admin block
  if (!isAdmin) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔒</div>
          <h2 className={styles.emptyTitle}>Khu Vực Hạn Chế</h2>
          <p className={styles.emptyDesc}>Bạn cần tài khoản có quyền Quản trị viên (Admin) để quản lý giáo trình.</p>
          <button className={styles.btnPrimary} onClick={onBack}>
            <ArrowLeft size={16} /> Về trang chủ
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
          <Check size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.titleWithBadge}>
            <h1 className={styles.title}>Quản lý Giáo trình & Bộ Sách</h1>
            <span className={styles.adminTag}>ADMIN PORTAL</span>
          </div>
          <p className={styles.subtitle}>
            Quản trị các Bộ giáo trình (book_series), phân chia cuốn sách (books) và cấu trúc bài học trong hệ thống.
          </p>
        </div>

        <div className={styles.actionGroup}>
          <button
            type="button"
            className={`${styles.btnSecondary} sketch-cross`}
            onClick={fetchCourses}
            disabled={loading}
            title="Tải lại danh sách"
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Làm mới</span>
          </button>

          {currentTab === 'books' ? (
            <button
              type="button"
              className={`${styles.btnPrimary} sketch-cross`}
              onClick={() => handleOpenBookModal()}
            >
              <Plus size={16} />
              <span>Thêm cuốn sách mới</span>
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.btnPrimary} sketch-cross`}
              onClick={() => handleOpenSeriesModal()}
            >
              <Plus size={16} />
              <span>Thêm bộ giáo trình mới</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        <div
          className={styles.statCard}
          style={{ cursor: 'pointer', borderColor: currentTab === 'series' ? '#2563eb' : '' }}
          onClick={() => setCurrentTab('series')}
        >
          <div className={styles.statIconWrap} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Layers size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalSeries}</span>
            <span className={styles.statLabel}>Bộ giáo trình (book_series)</span>
          </div>
        </div>

        <div
          className={styles.statCard}
          style={{ cursor: 'pointer', borderColor: currentTab === 'books' ? '#d97706' : '' }}
          onClick={() => setCurrentTab('books')}
        >
          <div className={styles.statIconWrap} style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <BookOpen size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalBooks}</span>
            <span className={styles.statLabel}>Cuốn sách / Cấp độ (books)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <FolderKanban size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalLessons}</span>
            <span className={styles.statLabel}>Bài học liên kết</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${currentTab === 'series' ? styles.tabBtnActive : ''} sketch-cross`}
          onClick={() => setCurrentTab('series')}
        >
          <Layers size={16} />
          <span>Quản lý Bộ giáo trình (book_series)</span>
          <span className={styles.tabBadge}>{stats.totalSeries}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${currentTab === 'books' ? styles.tabBtnActive : ''} sketch-cross`}
          onClick={() => setCurrentTab('books')}
        >
          <BookOpen size={16} />
          <span>Quản lý Cuốn sách (books)</span>
          <span className={styles.tabBadge}>{stats.totalBooks}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${currentTab === 'all' ? styles.tabBtnActive : ''} sketch-cross`}
          onClick={() => setCurrentTab('all')}
        >
          <FolderKanban size={16} />
          <span>Xem cây phân cấp (Accordion)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={16} color="#888" />
          <input
            className={styles.searchInput}
            placeholder={
              currentTab === 'series'
                ? 'Tìm kiếm theo tên bộ giáo trình...'
                : currentTab === 'books'
                ? 'Tìm theo tên cuốn sách hoặc bộ giáo trình...'
                : 'Tìm kiếm bộ giáo trình, tên sách...'
            }
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
      </div>

      {/* Loading state */}
      {loading ? (
        <div className={styles.emptyState}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#666' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Đang tải dữ liệu từ database...</span>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: BẢNG CRUD RIÊNG CHO BOOK_SERIES */}
          {currentTab === 'series' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 48, textAlign: 'center' }}>#</th>
                      <th>Tên Bộ giáo trình</th>
                      <th>Mô tả tóm tắt</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Vị trí</th>
                      <th style={{ width: 140 }}>Số cuốn sách</th>
                      <th style={{ width: 140 }}>Tổng bài học</th>
                      <th style={{ width: 130 }}>Ngày tạo</th>
                      <th style={{ width: 140, textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSeries.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '36px 0', color: '#888' }}>
                          Không tìm thấy bộ giáo trình nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredSeries.map((s, idx) => {
                        const booksCount = (s.books || []).length;
                        let lessonsCount = 0;
                        (s.books || []).forEach(b => {
                          lessonsCount += b.lessons?.[0]?.count || 0;
                        });

                        return (
                          <tr key={s.id}>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#888' }}>{idx + 1}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Layers size={17} color="#2563eb" />
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{s.name}</span>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', maxWidth: 280 }}>{s.description || '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={styles.orderBadge}>#{s.orderindex}</span>
                            </td>
                            <td>
                              <span className={styles.countBadge}>
                                <BookOpen size={12} /> {booksCount} sách
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.countBadge} ${styles.countBadgeLessons}`}>
                                <FolderKanban size={12} /> {lessonsCount} bài
                              </span>
                            </td>
                            <td style={{ color: '#888', fontSize: 12 }}>
                              {s.createdat ? new Date(s.createdat).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => handleOpenBookModal(s.id)}
                                  title="Thêm cuốn sách vào bộ này"
                                >
                                  <Plus size={15} color="#2b7fd4" />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => handleOpenSeriesModal(s)}
                                  title="Sửa thông tin bộ giáo trình"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                  onClick={() => handleConfirmDelete(s.id, s.name, 'series')}
                                  title="Xóa bộ giáo trình này"
                                >
                                  <Trash2 size={14} />
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
          )}

          {/* TAB 2: BẢNG CRUD RIÊNG CHO BOOKS */}
          {currentTab === 'books' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 48, textAlign: 'center' }}>#</th>
                      <th>Tên Cuốn sách / Cấp độ</th>
                      <th>Thuộc Bộ giáo trình (book_series)</th>
                      <th style={{ width: 140 }}>Số bài học</th>
                      <th style={{ width: 140 }}>Ngày tạo</th>
                      <th style={{ width: 120, textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: '#888' }}>
                          Không tìm thấy cuốn sách nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredBooks.map((b, idx) => {
                        const lessonCount = b.lessons?.[0]?.count || 0;
                        return (
                          <tr key={b.id}>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#888' }}>{idx + 1}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookOpen size={16} color="#d97706" />
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{b.bookName}</span>
                              </div>
                            </td>
                            <td>
                              <span className={styles.countBadge}>
                                <Layers size={12} /> {b.seriesName}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.countBadge} ${styles.countBadgeLessons}`}>
                                <FolderKanban size={12} /> {lessonCount} bài học
                              </span>
                            </td>
                            <td style={{ color: '#888', fontSize: 12 }}>
                              {b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => handleOpenBookModal(b.bookSeriId, b)}
                                  title="Đổi tên hoặc đổi bộ cho cuốn sách"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                  onClick={() => handleConfirmDelete(b.id, b.bookName, 'book')}
                                  title="Xóa cuốn sách này"
                                >
                                  <Trash2 size={14} />
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
          )}

          {/* TAB 3: CHẾ ĐỘ PHÂN CẤP ACCORDION */}
          {currentTab === 'all' && (
            <div className={styles.seriesList}>
              {filteredSeries.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📚</div>
                  <h2 className={styles.emptyTitle}>Chưa có bộ giáo trình nào</h2>
                  <p className={styles.emptyDesc}>Bấm vào nút "Thêm bộ giáo trình mới" ở góc trên để tạo bộ đầu tiên.</p>
                  <button className={styles.btnPrimary} onClick={() => handleOpenSeriesModal()}>
                    <Plus size={16} /> Thêm bộ giáo trình ngay
                  </button>
                </div>
              ) : (
                filteredSeries.map(series => {
                  const isExpanded = Boolean(expandedSeries[series.id]);
                  const books = series.books || [];
                  let seriesLessonsCount = 0;
                  books.forEach(b => {
                    seriesLessonsCount += b.lessons?.[0]?.count || 0;
                  });

                  return (
                    <div
                      key={series.id}
                      className={`${styles.seriesCard} ${isExpanded ? styles.seriesCardExpanded : ''}`}
                    >
                      {/* Series Header Row */}
                      <div className={styles.seriesHeader} onClick={() => toggleExpand(series.id)}>
                        <div className={styles.seriesTitleCol}>
                          <div className={styles.seriesNameWrap}>
                            <span className={styles.seriesName}>{series.name}</span>
                            <span className={styles.orderBadge}>Vị trí: #{series.orderindex}</span>
                          </div>
                          {series.description && (
                            <p className={styles.seriesDesc}>{series.description}</p>
                          )}
                        </div>

                        <div className={styles.seriesRightCol} onClick={e => e.stopPropagation()}>
                          <div className={styles.badgeGroup}>
                            <span className={styles.countBadge}>
                              <BookOpen size={13} /> {books.length} sách
                            </span>
                            <span className={`${styles.countBadge} ${styles.countBadgeLessons}`}>
                              <FolderKanban size={13} /> {seriesLessonsCount} bài học
                            </span>
                          </div>

                          <div className={styles.seriesActions}>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => handleOpenBookModal(series.id)}
                              title="Thêm cuốn sách vào bộ này"
                            >
                              <Plus size={16} color="#2b7fd4" />
                            </button>

                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => handleOpenSeriesModal(series)}
                              title="Sửa bộ giáo trình"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              onClick={() => handleConfirmDelete(series.id, series.name, 'series')}
                              title="Xóa bộ giáo trình"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.chevronBtn}`}
                            onClick={() => toggleExpand(series.id)}
                            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                          >
                            <ChevronDown size={17} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Books List */}
                      {isExpanded && (
                        <div className={styles.booksArea}>
                          <div className={styles.booksAreaHeader}>
                            <span className={styles.booksAreaTitle}>
                              Các cuốn sách trong bộ ({books.length})
                            </span>
                            <button
                              type="button"
                              className={`${styles.btnSecondary} sketch-cross`}
                              style={{ padding: '6px 12px', fontSize: 12.5 }}
                              onClick={() => handleOpenBookModal(series.id)}
                            >
                              <Plus size={14} /> Thêm sách
                            </button>
                          </div>

                          {books.length === 0 ? (
                            <div className={styles.emptyBooks}>
                              Bộ giáo trình này chưa có cuốn sách nào. Hãy bấm "Thêm sách" để tạo cấp độ đầu tiên!
                            </div>
                          ) : (
                            <div className={styles.booksGrid}>
                              {books.map(book => {
                                const lessonCount = book.lessons?.[0]?.count || 0;
                                return (
                                  <div key={book.id} className={styles.bookCard}>
                                    <div className={styles.bookInfo}>
                                      <div className={styles.bookIcon}>
                                        <BookOpen size={18} />
                                      </div>
                                      <div className={styles.bookNameCol}>
                                        <span className={styles.bookName} title={book.bookName}>
                                          {book.bookName}
                                        </span>
                                        <span className={styles.bookMeta}>
                                          {lessonCount} bài học
                                        </span>
                                      </div>
                                    </div>

                                    <div className={styles.bookActions}>
                                      <button
                                        type="button"
                                        className={styles.iconBtn}
                                        onClick={() => handleOpenBookModal(series.id, book)}
                                        title="Đổi tên cuốn sách"
                                      >
                                        <Edit3 size={14} />
                                      </button>

                                      <button
                                        type="button"
                                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                        onClick={() => handleConfirmDelete(book.id, book.bookName, 'book')}
                                        title="Xóa cuốn sách này"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Add/Edit Series (CRUD book_series) */}
      {isSeriesModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSeriesModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingSeries ? 'Chỉnh sửa Bộ giáo trình (book_series)' : 'Tạo mới Bộ giáo trình (book_series)'}
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsSeriesModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSeries}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên bộ giáo trình (name) *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="Ví dụ: Nhai Giáo Trình Thời Đại"
                    value={seriesName}
                    onChange={e => setSeriesName(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mô tả tóm tắt (description)</label>
                  <textarea
                    className={`${styles.formInput} ${styles.formTextarea}`}
                    placeholder="Mô tả mục tiêu, đối tượng học hoặc phiên bản giáo trình..."
                    value={seriesDesc}
                    onChange={e => setSeriesDesc(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Thứ tự hiển thị (orderindex)</label>
                  <input
                    type="number"
                    min={1}
                    className={styles.formInput}
                    value={seriesOrder}
                    onChange={e => setSeriesOrder(Number(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsSeriesModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang lưu...' : editingSeries ? 'Lưu thay đổi' : 'Tạo bộ mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Book (CRUD books) */}
      {isBookModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsBookModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingBook ? 'Chỉnh sửa Cuốn sách (books)' : 'Thêm Cuốn sách mới (books)'}
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsBookModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBook}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Thuộc Bộ giáo trình (bookSeriId) *</label>
                  <select
                    className={styles.formInput}
                    value={targetSeriesId}
                    onChange={e => setTargetSeriesId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Chọn bộ giáo trình --</option>
                    {seriesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (#{s.orderindex})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên cuốn sách (bookName) *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="Ví dụ: Giáo trình thời đại 1"
                    value={bookName}
                    onChange={e => setBookName(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsBookModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang lưu...' : editingBook ? 'Cập nhật' : 'Thêm sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {isDeleteModalOpen && deletingItem && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#c23838' }}>
                Xác nhận xóa {deletingItem.type === 'series' ? 'Bộ giáo trình (book_series)' : 'Cuốn sách (books)'}
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#333' }}>
                Bạn có chắc chắn muốn xóa{' '}
                <strong>"{deletingItem.name}"</strong>?
              </p>
              {deletingItem.type === 'series' && (
                <div style={{ backgroundColor: '#fff3cd', border: '1.5px solid #ffeeba', color: '#856404', padding: '10px 14px', borderRadius: 6, fontSize: 12.5 }}>
                  ⚠️ Lưu ý: Khi xóa bộ giáo trình, các cuốn sách và bài học liên kết bên trong sẽ bị ảnh hưởng.
                </div>
              )}
            </div>

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
                className={`${styles.btnPrimary} ${styles.btnDanger}`}
                onClick={handleDeleteItem}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
