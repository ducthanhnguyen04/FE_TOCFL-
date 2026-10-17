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
  ExternalLink,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Code2
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

  // Modal: Bulk Import Lessons
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDefaultBookId, setBulkDefaultBookId] = useState('');
  const [bulkJsonInput, setBulkJsonInput] = useState('');
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [parsedBulkLessons, setParsedBulkLessons] = useState<any[]>([]);

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
    }).sort((a, b) => {
      const parseNum = (name: string) => {
        if (!name) return 999999;
        const m = name.match(/(?:bài|lesson|chương|unit|đoạn|phần|tiết|第)\s*(\d+)/i) || name.match(/\d+/);
        return m ? parseInt(m[1] || m[0], 10) : 999999;
      };
      const numA = parseNum(a.lessonName);
      const numB = parseNum(b.lessonName);
      if (numA !== numB) return numA - numB;
      return a.lessonName.localeCompare(b.lessonName, undefined, { numeric: true, sensitivity: 'base' });
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

  // Bulk Import Handlers
  const SAMPLE_BULK_JSON = JSON.stringify(
    [
      {
        lessonName: "Bài 1: Giới thiệu bản thân & Chào hỏi",
        isLocked: false,
        wordCount: 20
      },
      {
        lessonName: "Bài 2: Mua sắm & Giá cả trong sinh hoạt",
        isLocked: false,
        wordCount: 25
      },
      {
        lessonName: "Bài 3: Đặt bàn ăn tại nhà hàng (VIP)",
        isLocked: true,
        wordCount: 30
      }
    ],
    null,
    2
  );

  const handleOpenBulkModal = () => {
    const defaultBook =
      selectedBookId !== 'all' ? selectedBookId : books[0]?.id || '';
    setBulkDefaultBookId(defaultBook);
    setBulkParseError(null);
    if (!bulkJsonInput.trim()) {
      setBulkJsonInput(SAMPLE_BULK_JSON);
      try {
        setParsedBulkLessons(JSON.parse(SAMPLE_BULK_JSON));
      } catch {
        setParsedBulkLessons([]);
      }
    } else {
      // Re-validate existing content
      handleJsonChange(bulkJsonInput);
    }
    setIsBulkModalOpen(true);
  };

  const handleJsonChange = (text: string) => {
    setBulkJsonInput(text);
    if (!text.trim()) {
      setBulkParseError(null);
      setParsedBulkLessons([]);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setBulkParseError('Dữ liệu JSON phải là một mảng [] (Array các bài học)');
        setParsedBulkLessons([]);
        return;
      }
      if (parsed.length === 0) {
        setBulkParseError('Mảng JSON không chứa phần tử bài học nào');
        setParsedBulkLessons([]);
        return;
      }

      // Check item validity
      const invalidIndex = parsed.findIndex(
        (item: any) =>
          !item || typeof item !== 'object' || !(item.lessonName || item.name || item.title)
      );
      if (invalidIndex !== -1) {
        setBulkParseError(`Phần tử thứ #${invalidIndex + 1} thiếu tên bài học (lessonName)`);
        setParsedBulkLessons(parsed);
        return;
      }

      setBulkParseError(null);
      setParsedBulkLessons(parsed);
    } catch (err: any) {
      setBulkParseError(`Cú pháp JSON không hợp lệ: ${err.message}`);
      setParsedBulkLessons([]);
    }
  };

  const handleInsertSampleJson = () => {
    handleJsonChange(SAMPLE_BULK_JSON);
  };

  const handleClearJson = () => {
    setBulkJsonInput('');
    setBulkParseError(null);
    setParsedBulkLessons([]);
  };

  const handleExecuteBulkImport = async () => {
    if (parsedBulkLessons.length === 0) {
      alert('Vui lòng cung cấp dữ liệu JSON bài học hợp lệ!');
      return;
    }

    if (bulkParseError) {
      alert(`Vui lòng sửa lỗi trước khi nhập: ${bulkParseError}`);
      return;
    }

    // Check if any lesson lacks bookId and no default book is selected
    const missingBook = parsedBulkLessons.some(l => !l.bookId && !bulkDefaultBookId);
    if (missingBook) {
      alert('Một số bài học chưa có bookId. Vui lòng chọn "Cuốn sách mặc định" ở mục bên trên!');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_create',
          lessons: parsedBulkLessons,
          defaultBookId: bulkDefaultBookId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi nhập hàng loạt bài học');

      showToast(`🎉 ${data.message || `Đã nhập thành công ${data.count} bài học!`}`);
      setIsBulkModalOpen(false);
      fetchLessonsData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nhập hàng loạt');
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
            className={styles.btnBulk}
            onClick={handleOpenBulkModal}
            title="Nhập hàng loạt bài học từ JSON"
          >
            <FileJson size={16} />
            <span>Nhập hàng loạt</span>
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
                        <button
                          type="button"
                          className={styles.countBadge}
                          onClick={() => onNavigateToVocabularies?.(lesson.id)}
                          title="Xem và quản lý từ vựng của bài học này"
                          style={{ cursor: onNavigateToVocabularies ? 'pointer' : 'default', border: 'none', background: '#fef3c7' }}
                        >
                          <BookA size={12} /> {vocabCount} từ vựng
                        </button>
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
                          {/* Quản lý từ vựng */}
                          {onNavigateToVocabularies && (
                            <button
                              type="button"
                              className={styles.iconBtn}
                              style={{ color: '#7c3aed' }}
                              onClick={() => onNavigateToVocabularies(lesson.id)}
                              title="Quản lý các từ vựng trong bài học này"
                            >
                              <BookA size={15} />
                            </button>
                          )}

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

      {/* ==================== MODAL: NHẬP HÀNG LOẠT (BULK JSON) ==================== */}
      {isBulkModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsBulkModalOpen(false)}>
          <div
            className={`${styles.modalBox} ${styles.modalBoxWide}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={styles.bulkIconCircle}>
                  <FileJson size={20} color="#7c3aed" />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Nhập Hàng Loạt Bài Học</h3>
                  <p className={styles.modalSubtitle}>
                    Dán chuỗi JSON danh sách bài học để thêm nhanh vào hệ thống
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsBulkModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.bulkFormContent}>
              {/* Chọn sách mặc định */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Cuốn sách mặc định <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(áp dụng cho bài chưa có bookId trong JSON)</span>
                </label>
                <select
                  className={styles.formInput}
                  value={bulkDefaultBookId}
                  onChange={e => setBulkDefaultBookId(e.target.value)}
                >
                  <option value="">-- Chọn cuốn sách --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bookName} {b.book_series?.name ? `(${b.book_series.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* JSON Toolbar */}
              <div className={styles.jsonToolbar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className={styles.smallActionBtn}
                    onClick={handleInsertSampleJson}
                    title="Chèn dữ liệu JSON mẫu chuẩn"
                  >
                    <Sparkles size={13} />
                    <span>Chèn JSON mẫu</span>
                  </button>
                  <button
                    type="button"
                    className={styles.smallActionBtn}
                    onClick={handleClearJson}
                    title="Xóa trắng khung nhập"
                  >
                    <Trash2 size={13} />
                    <span>Xóa</span>
                  </button>
                </div>

                {/* Validation Status Badge */}
                <div>
                  {bulkParseError ? (
                    <span className={styles.statusBadgeError}>
                      <AlertCircle size={13} />
                      <span>{bulkParseError.length > 35 ? 'Lỗi cú pháp JSON' : bulkParseError}</span>
                    </span>
                  ) : parsedBulkLessons.length > 0 ? (
                    <span className={styles.statusBadgeSuccess}>
                      <CheckCircle2 size={13} />
                      <span>{parsedBulkLessons.length} bài học hợp lệ</span>
                    </span>
                  ) : (
                    <span className={styles.statusBadgeEmpty}>Chưa có dữ liệu</span>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <div className={styles.formGroup} style={{ marginBottom: 12 }}>
                <textarea
                  className={styles.jsonTextarea}
                  rows={9}
                  placeholder={`[
  {
    "lessonName": "Bài 1: Chào hỏi cơ bản",
    "isLocked": false,
    "wordCount": 15
  }
]`}
                  value={bulkJsonInput}
                  onChange={e => handleJsonChange(e.target.value)}
                  spellCheck={false}
                />
              </div>

              {/* Error Alert Box */}
              {bulkParseError && (
                <div className={styles.jsonErrorAlert}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Phát hiện lỗi JSON:</strong> {bulkParseError}
                  </div>
                </div>
              )}

              {/* Warning if missing bookId */}
              {!bulkParseError &&
                parsedBulkLessons.length > 0 &&
                !bulkDefaultBookId &&
                parsedBulkLessons.some(l => !l.bookId) && (
                  <div className={styles.jsonWarningAlert}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Cảnh báo:</strong> Một số bài học trong danh sách chưa có <code>bookId</code>. Vui lòng chọn <strong>Cuốn sách mặc định</strong> ở trên để tự động gán!
                    </div>
                  </div>
                )}

              {/* Live Preview of parsed items */}
              {!bulkParseError && parsedBulkLessons.length > 0 && (
                <div className={styles.jsonPreviewBox}>
                  <div className={styles.previewHeader}>
                    <span style={{ fontWeight: 800 }}>Xem trước ({parsedBulkLessons.length} bài):</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {parsedBulkLessons.filter(l => Boolean(l.isLocked ?? l.locked ?? l.isPremium)).length} bài VIP Khóa / {parsedBulkLessons.filter(l => !Boolean(l.isLocked ?? l.locked ?? l.isPremium)).length} bài Miễn phí
                    </span>
                  </div>
                  <div className={styles.previewChipsList}>
                    {parsedBulkLessons.slice(0, 15).map((item, idx) => {
                      const name = item.lessonName || item.name || item.title || `Bài #${idx + 1}`;
                      const isLocked = Boolean(item.isLocked ?? item.locked ?? item.isPremium);
                      return (
                        <div key={idx} className={styles.previewChip}>
                          {isLocked ? <Lock size={12} color="#e11d48" /> : <Unlock size={12} color="#059669" />}
                          <span className={styles.previewChipText}>{name}</span>
                          {item.wordCount ? <span className={styles.previewChipCount}>{item.wordCount} từ</span> : null}
                        </div>
                      );
                    })}
                    {parsedBulkLessons.length > 15 && (
                      <div className={styles.previewChipMore}>
                        +{parsedBulkLessons.length - 15} bài khác...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsBulkModalOpen(false)}
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={styles.btnBulkConfirm}
                onClick={handleExecuteBulkImport}
                disabled={actionLoading || parsedBulkLessons.length === 0 || Boolean(bulkParseError)}
              >
                <Check size={16} />
                <span>
                  {actionLoading
                    ? 'Đang nhập...'
                    : `Nhập ${parsedBulkLessons.length > 0 ? `${parsedBulkLessons.length} bài học` : 'hàng loạt'}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
