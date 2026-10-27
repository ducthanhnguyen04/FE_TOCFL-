'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileQuestion,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  FolderKanban,
  Edit2,
  Trash2,
  X,
  FileJson,
  ShieldCheck,
  Check,
  ChevronRight,
  BookOpenCheck,
  AlertTriangle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import styles from './AdminReadingsView.module.css';

export interface ReadingItem {
  id: string;
  lessonId: string;
  question: string;
  pinyin?: string;
  vietnameseMeaning?: string;
  createdAt?: string;
  updatedAt?: string;
  answers?: string[];
  primaryAnswer?: string;
  fullSentence?: string;
  lessons?: {
    id: string;
    lessonName: string;
    bookId: string;
    books?: {
      id: string;
      bookName: string;
      bookSeriId: string;
      book_series?: {
        id: string;
        name: string;
      };
    };
  };
}

export interface LessonOption {
  id: string;
  lessonName: string;
  bookId: string;
  books?: {
    id: string;
    bookName: string;
    bookSeriId: string;
    book_series?: {
      id: string;
      name: string;
    };
  };
}

export interface BookOption {
  id: string;
  bookName: string;
  bookSeriId: string;
  book_series?: {
    id: string;
    name: string;
  };
}

interface AdminReadingsViewProps {
  onBack?: () => void;
  initialLessonId?: string;
}

export const AdminReadingsView: React.FC<AdminReadingsViewProps> = ({
  onBack,
  initialLessonId
}) => {
  const { isAdmin } = useUser();

  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string>('all');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLessonId || 'all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form Fields (Single Create / Edit)
  const [editingReading, setEditingReading] = useState<ReadingItem | null>(null);
  const [deletingReading, setDeletingReading] = useState<ReadingItem | null>(null);
  const [formLessonId, setFormLessonId] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formPinyin, setFormPinyin] = useState('');
  const [formVietnameseMeaning, setFormVietnameseMeaning] = useState('');
  const [formAnswer, setFormAnswer] = useState('');

  // Bulk Import
  const [bulkDefaultLessonId, setBulkDefaultLessonId] = useState('');
  const [bulkJson, setBulkJson] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const questionInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch readings data
  const fetchReadingsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/readings');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.readings)) {
        setReadings(data.readings);
      }
      if (Array.isArray(data.lessons)) {
        setLessons(data.lessons);
      }
      if (Array.isArray(data.books)) {
        setBooks(data.books);
      }
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu câu hỏi reading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchReadingsData();
    }
  }, [isAdmin]);

  // Lessons filtered by book selection
  const availableLessons = useMemo(() => {
    if (selectedBookId === 'all') return lessons;
    return lessons.filter(l => l.bookId === selectedBookId);
  }, [lessons, selectedBookId]);

  // KPIs
  const stats = useMemo(() => {
    const totalQuestions = readings.length;
    const answeredCount = readings.filter(r => r.answers && r.answers.length > 0).length;
    const uniqueLessonsCount = new Set(readings.map(r => r.lessonId)).size;
    return { totalQuestions, answeredCount, uniqueLessonsCount };
  }, [readings]);

  // Filtered readings
  const filteredReadings = useMemo(() => {
    return readings.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.question?.toLowerCase().includes(q) ||
        r.pinyin?.toLowerCase().includes(q) ||
        r.vietnameseMeaning?.toLowerCase().includes(q) ||
        r.answers?.some(a => a.toLowerCase().includes(q)) ||
        r.lessons?.lessonName?.toLowerCase().includes(q);

      const matchBook =
        selectedBookId === 'all' || r.lessons?.bookId === selectedBookId;

      const matchLesson =
        selectedLessonId === 'all' || r.lessonId === selectedLessonId;

      return matchSearch && matchBook && matchLesson;
    });
  }, [readings, searchQuery, selectedBookId, selectedLessonId]);

  // Helpers to highlight blank slot
  const renderHighlightedQuestion = (text: string) => {
    if (!text) return null;
    if (!text.includes('____')) {
      return <span>{text}</span>;
    }
    const parts = text.split('____');
    return (
      <span>
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <span className={styles.blankSlotHighlight}>____</span>
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  // Helper to insert blank slot at cursor
  const handleInsertBlank = () => {
    const input = questionInputRef.current;
    if (!input) {
      setFormQuestion(prev => prev + '____');
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = formQuestion;
    const newText = text.substring(0, start) + '____' + text.substring(end);
    setFormQuestion(newText);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + 4, start + 4);
    }, 0);
  };

  // Open Modal: Add Single
  const handleOpenAddModal = () => {
    setFormLessonId(
      selectedLessonId !== 'all' ? selectedLessonId : lessons[0]?.id || ''
    );
    setFormQuestion('');
    setFormPinyin('');
    setFormVietnameseMeaning('');
    setFormAnswer('');
    setIsAddModalOpen(true);
  };

  // Open Modal: Edit Single
  const handleOpenEditModal = (r: ReadingItem) => {
    setEditingReading(r);
    setFormLessonId(r.lessonId);
    setFormQuestion(r.question || '');
    setFormPinyin(r.pinyin || '');
    setFormVietnameseMeaning(r.vietnameseMeaning || '');
    setFormAnswer(r.answers ? r.answers.join(', ') : (r.primaryAnswer || ''));
    setIsEditModalOpen(true);
  };

  // Save Single Add / Edit
  const handleSaveReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    if (!formLessonId) {
      alert('Vui lòng chọn bài học');
      return;
    }
    const answersList = formAnswer
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    if (answersList.length === 0) {
      alert('Vui lòng nhập ít nhất một đáp án đúng cho câu hỏi');
      return;
    }

    try {
      const isEdit = Boolean(editingReading);
      const res = await fetch('/api/admin/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdit ? 'update_reading' : 'create_reading',
          id: editingReading?.id,
          lessonId: formLessonId,
          question: formQuestion.trim(),
          pinyin: formPinyin.trim(),
          vietnameseMeaning: formVietnameseMeaning.trim(),
          answers: answersList,
          answer: answersList[0]
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Có lỗi xảy ra khi lưu câu hỏi');
        return;
      }

      showToast(isEdit ? '✅ Đã cập nhật câu hỏi đọc hiểu!' : '🎉 Thêm mới câu hỏi thành công!');
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setEditingReading(null);
      fetchReadingsData();
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Delete
  const handleDeleteReading = async () => {
    if (!deletingReading) return;
    try {
      const res = await fetch(`/api/admin/readings?id=${encodeURIComponent(deletingReading.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Không thể xóa câu hỏi này');
        return;
      }
      showToast('🗑️ Đã xóa câu hỏi đọc hiểu thành công!');
      setIsDeleteModalOpen(false);
      setDeletingReading(null);
      setReadings(prev => prev.filter(r => r.id !== deletingReading.id));
    } catch (err) {
      alert('Lỗi kết nối khi xóa câu hỏi');
    }
  };

  // Bulk Modal Open
  const handleOpenBulkModal = () => {
    setBulkDefaultLessonId(
      selectedLessonId !== 'all' ? selectedLessonId : lessons[0]?.id || ''
    );
    setIsBulkModalOpen(true);
  };

  // Sample JSON for Bulk Import
  const handleInsertSampleJson = () => {
    const sample = [
      {
        question: "____好，我叫小明。",
        pinyin: "____ hǎo, wǒ jiào Xiǎomíng.",
        vietnameseMeaning: "Chào bạn, tôi tên Tiểu Minh.",
        answer: "你"
      },
      {
        question: "你____吗？",
        pinyin: "Nǐ ____ ma?",
        vietnameseMeaning: "Bạn khỏe không?",
        answer: "好"
      },
      {
        question: "____好，我是老师。",
        pinyin: "____ hǎo, wǒ shì lǎoshī.",
        vietnameseMeaning: "Chào các bạn, tôi là giáo viên.",
        answer: "你们"
      },
      {
        question: "王____，你好！",
        pinyin: "Wáng ____, nǐ hǎo!",
        vietnameseMeaning: "Chào thầy Vương!",
        answer: "老师"
      },
      {
        question: "____你！ - 不客气。",
        pinyin: "____ nǐ! - Bú kèqì.",
        vietnameseMeaning: "Cảm ơn bạn! - Không có gì.",
        answer: "谢谢"
      }
    ];
    setBulkJson(JSON.stringify(sample, null, 2));
  };

  // Parse bulk json preview
  const parsedBulkReadings = useMemo(() => {
    if (!bulkJson.trim()) return [];
    try {
      const obj = JSON.parse(bulkJson);
      return Array.isArray(obj) ? obj : [];
    } catch (e) {
      return [];
    }
  }, [bulkJson]);

  // Bulk Submit
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkReadings.length === 0) {
      alert('Chuỗi JSON không hợp lệ hoặc rỗng. Vui lòng kiểm tra lại cấu trúc cú pháp JSON.');
      return;
    }
    if (!bulkDefaultLessonId) {
      alert('Vui lòng chọn bài học mặc định để gán cho các câu hỏi.');
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await fetch('/api/admin/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_create',
          readings: parsedBulkReadings,
          defaultLessonId: bulkDefaultLessonId
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Có lỗi xảy ra khi nhập hàng loạt');
        return;
      }

      showToast(`🎉 ${data.message || `Đã nhập thành công ${data.count} câu hỏi đọc hiểu!`}`);
      setIsBulkModalOpen(false);
      setBulkJson('');
      fetchReadingsData();
    } catch (err) {
      alert('Lỗi kết nối khi gửi dữ liệu nhập hàng loạt');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Preview full sentence for modal
  const previewFullSentence = useMemo(() => {
    if (!formQuestion) return '';
    const ans = formAnswer.split(',')[0]?.trim() || '____';
    return formQuestion.replace('____', ans);
  }, [formQuestion, formAnswer]);

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
            <h1 className={styles.title}>Quản Lý Đọc Hiểu (Readings)</h1>
            <span className={styles.adminTag}>
              <ShieldCheck size={12} /> Admin
            </span>
          </div>
          <p className={styles.subtitle}>
            Quản trị kho câu hỏi bài tập đọc hiểu (Điền chỗ trống `____`), phiên âm Pinyin, nghĩa tiếng Việt và đáp án đúng liên kết 2 bảng <strong>readings</strong> &amp; <strong>readingAnswers</strong>.
          </p>
        </div>

        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={fetchReadingsData}
            title="Tải lại dữ liệu câu hỏi"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            className={styles.btnBulk}
            onClick={handleOpenBulkModal}
            title="Nhập hàng loạt câu hỏi từ JSON kèm đáp án"
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
            <span>Thêm Câu Hỏi Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <FileQuestion size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.totalQuestions}</span>
            <span className={styles.statLabel}>Tổng số câu hỏi đọc hiểu</span>
          </div>
        </div>

        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.answeredCount}</span>
            <span className={styles.statLabel}>Câu đã có đáp án</span>
          </div>
        </div>

        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <FolderKanban size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.uniqueLessonsCount}</span>
            <span className={styles.statLabel}>Bài học có câu hỏi</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={`${styles.toolbarCard} sketch-box`}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm theo câu hỏi, phiên âm, nghĩa tiếng Việt, đáp án..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          {/* Lọc theo sách */}
          <select
            className={styles.filterSelect}
            value={selectedBookId}
            onChange={(e) => {
              setSelectedBookId(e.target.value);
              setSelectedLessonId('all');
            }}
          >
            <option value="all">Tất cả giáo trình ({books.length})</option>
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.bookName} {b.book_series?.name ? `(${b.book_series.name})` : ''}
              </option>
            ))}
          </select>

          {/* Lọc theo bài học */}
          <select
            className={styles.filterSelect}
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
          >
            <option value="all">Tất cả bài học ({availableLessons.length})</option>
            {availableLessons.map(l => (
              <option key={l.id} value={l.id}>
                {l.lessonName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center' }}>#</th>
                <th style={{ minWidth: 260 }}>Câu hỏi (Chỗ trống `____`)</th>
                <th style={{ minWidth: 220 }}>Phiên âm &amp; Nghĩa tiếng Việt</th>
                <th style={{ minWidth: 140 }}>Đáp án đúng</th>
                <th style={{ minWidth: 220 }}>Câu hoàn chỉnh khi điền</th>
                <th style={{ minWidth: 160 }}>Bài học</th>
                <th style={{ width: 90, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#2b7fd4' }} />
                    <p style={{ margin: 0, color: '#64748b', fontWeight: 600 }}>Đang tải dữ liệu câu hỏi đọc hiểu...</p>
                  </td>
                </tr>
              ) : filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <BookOpenCheck size={44} style={{ color: '#94a3b8' }} />
                      <h4 className={styles.emptyStateTitle}>Không tìm thấy câu hỏi đọc hiểu nào</h4>
                      <p className={styles.emptyStateDesc}>
                        Thử thay đổi từ khóa tìm kiếm, bộ lọc bài học hoặc bấm <strong>"Thêm Câu Hỏi Mới"</strong> / <strong>"Nhập hàng loạt"</strong> để thêm dữ liệu.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReadings.map((reading, idx) => {
                  const hasAnswer = reading.answers && reading.answers.length > 0;
                  return (
                    <tr key={reading.id}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>
                        {idx + 1}
                      </td>

                      {/* Câu hỏi có highlight chỗ trống */}
                      <td>
                        <div className={styles.questionBox}>
                          <span className={styles.questionText}>
                            {renderHighlightedQuestion(reading.question)}
                          </span>
                        </div>
                      </td>

                      {/* Phiên âm & Nghĩa */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {reading.pinyin ? (
                            <span className={styles.pinyinText}>{reading.pinyin}</span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: 11 }}>Chưa có pinyin</span>
                          )}
                          {reading.vietnameseMeaning ? (
                            <span className={styles.meaningText}>{reading.vietnameseMeaning}</span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: 11 }}>Chưa có nghĩa</span>
                          )}
                        </div>
                      </td>

                      {/* Đáp án đúng */}
                      <td>
                        <div className={styles.answersList}>
                          {hasAnswer ? (
                            reading.answers!.map((ans, aIdx) => (
                              <span key={aIdx} className={styles.answerBadge}>
                                <Check size={12} />
                                {ans}
                              </span>
                            ))
                          ) : (
                            <span className={styles.noAnswerBadge}>
                              <AlertTriangle size={11} /> Chưa có đáp án
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Câu hoàn chỉnh khi điền */}
                      <td>
                        <div className={styles.fullSentence}>
                          {reading.fullSentence ? (
                            reading.question?.includes('____') ? (
                              <span>
                                {reading.question.split('____')[0]}
                                <span className={styles.filledAnswer}>{reading.primaryAnswer || '____'}</span>
                                {reading.question.split('____')[1]}
                              </span>
                            ) : (
                              reading.fullSentence
                            )
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>--</span>
                          )}
                        </div>
                      </td>

                      {/* Bài học */}
                      <td>
                        <div className={styles.lessonBadge}>
                          <span className={styles.lessonName}>
                            {reading.lessons?.lessonName || 'Không xác định'}
                          </span>
                          {reading.lessons?.books && (
                            <span className={styles.bookName}>
                              {reading.lessons.books.bookName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => handleOpenEditModal(reading)}
                            title="Chỉnh sửa câu hỏi"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => {
                              setDeletingReading(reading);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Xóa câu hỏi"
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

      {/* Modal: Thêm / Sửa câu hỏi */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalIcon}>
                  <FileQuestion size={18} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>
                    {isEditModalOpen ? 'Chỉnh Sửa Câu Hỏi Đọc Hiểu' : 'Thêm Câu Hỏi Đọc Hiểu Mới'}
                  </h3>
                  <p className={styles.modalSubtitle}>
                    {isEditModalOpen
                      ? 'Cập nhật nội dung câu hỏi, phiên âm và đáp án liên quan'
                      : 'Thêm mới câu hỏi đọc hiểu điền vào chỗ trống ____ cho bài học'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingReading(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReading}>
              <div className={styles.modalBody}>
                {/* Chọn bài học */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Bài học thuộc về *</span>
                  </label>
                  <select
                    className={styles.formSelect}
                    value={formLessonId}
                    onChange={(e) => setFormLessonId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Chọn bài học --</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.lessonName} {l.books ? `(${l.books.bookName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Câu hỏi */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Nội dung câu hỏi (Chứa dấu gạch dưới `____`) *</span>
                    <button
                      type="button"
                      className={styles.insertBlankBtn}
                      onClick={handleInsertBlank}
                      title="Chèn 4 dấu gạch dưới ____ tại vị trí con trỏ"
                    >
                      + Chèn chỗ trống `____`
                    </button>
                  </label>
                  <input
                    ref={questionInputRef}
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: ____好，我叫小明。"
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    required
                  />
                </div>

                {/* Phiên âm Pinyin */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Phiên âm Pinyin</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: ____ hǎo, wǒ jiào Xiǎomíng."
                    value={formPinyin}
                    onChange={(e) => setFormPinyin(e.target.value)}
                  />
                </div>

                {/* Nghĩa tiếng Việt */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Nghĩa tiếng Việt</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: Chào bạn, tôi tên Tiểu Minh."
                    value={formVietnameseMeaning}
                    onChange={(e) => setFormVietnameseMeaning(e.target.value)}
                  />
                </div>

                {/* Đáp án đúng */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Đáp án đúng (Nếu có nhiều đáp án, phân tách bằng dấu phẩy `,`) *</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: 你 (hoặc: 你, 您)"
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    required
                  />
                </div>

                {/* Real-time Preview */}
                {formQuestion && (
                  <div className={styles.previewBox}>
                    <span className={styles.previewLabel}>Xem trước câu hoàn chỉnh khi học sinh điền:</span>
                    <div className={styles.previewContent}>
                      {previewFullSentence}
                    </div>
                    {formPinyin && (
                      <div className={styles.previewPinyin}>Pinyin: {formPinyin}</div>
                    )}
                    {formVietnameseMeaning && (
                      <div className={styles.previewMeaning}>Nghĩa: {formVietnameseMeaning}</div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingReading(null);
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  <Check size={16} />
                  <span>{isEditModalOpen ? 'Cập nhật' : 'Thêm câu hỏi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nhập hàng loạt từ JSON */}
      {isBulkModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.modalContentLarge}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalIcon} style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
                  <FileJson size={18} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Nhập Hàng Loạt Câu Hỏi Đọc Hiểu</h3>
                  <p className={styles.modalSubtitle}>
                    Dán mảng JSON chứa các câu hỏi, phiên âm và đáp án liên kết tự động vào 2 bảng readings &amp; readingAnswers
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsBulkModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit}>
              <div className={styles.modalBody}>
                {/* Bài học mặc định */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Bài học mặc định (Áp dụng nếu câu hỏi trong JSON chưa có lessonId) *</span>
                  </label>
                  <select
                    className={styles.formSelect}
                    value={bulkDefaultLessonId}
                    onChange={(e) => setBulkDefaultLessonId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Chọn bài học mặc định --</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.lessonName} {l.books ? `(${l.books.bookName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toolbar JSON */}
                <div className={styles.bulkTools}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className={styles.btnTemplate}
                      onClick={handleInsertSampleJson}
                    >
                      <Sparkles size={14} /> Chèn JSON mẫu
                    </button>
                    <button
                      type="button"
                      className={styles.btnClear}
                      onClick={() => setBulkJson('')}
                    >
                      Xóa
                    </button>
                  </div>

                  {parsedBulkReadings.length > 0 && (
                    <span className={styles.jsonCountBadge}>
                      ✓ Đã nhận diện {parsedBulkReadings.length} câu hỏi hợp lệ
                    </span>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  className={styles.jsonTextarea}
                  placeholder={`[
  {
    "question": "____好，我叫小明。",
    "pinyin": "____ hǎo, wǒ jiào Xiǎomíng.",
    "vietnameseMeaning": "Chào bạn, tôi tên Tiểu Minh.",
    "answer": "你"
  }
]`}
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  required
                />

                {/* Preview Chips */}
                {parsedBulkReadings.length > 0 && (
                  <div className={styles.bulkPreviewArea}>
                    <div className={styles.bulkPreviewTitle}>
                      Xem trước ({parsedBulkReadings.length} câu hỏi):
                    </div>
                    <div className={styles.bulkPreviewPills}>
                      {parsedBulkReadings.slice(0, 15).map((item, idx) => (
                        <div key={idx} className={styles.bulkPill}>
                          <strong>#{idx + 1}</strong>
                          <span>{item.question}</span>
                          <span style={{ color: '#16a34a', fontWeight: 800 }}>({item.answer || item.answers?.[0] || '?'})</span>
                        </div>
                      ))}
                      {parsedBulkReadings.length > 15 && (
                        <div className={styles.bulkPill} style={{ fontStyle: 'italic', color: '#64748b' }}>
                          ... và {parsedBulkReadings.length - 15} câu hỏi khác
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setIsBulkModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={bulkSubmitting}
                >
                  {bulkSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Đang lưu vào cơ sở dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Nhập {parsedBulkReadings.length > 0 ? `${parsedBulkReadings.length} câu hỏi` : 'dữ liệu'} ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa */}
      {isDeleteModalOpen && deletingReading && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 440 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalIcon} style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Xác Nhận Xóa Câu Hỏi</h3>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingReading(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa câu hỏi đọc hiểu này?
              </p>
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                padding: '10px 14px',
                marginTop: 8
              }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>
                  {deletingReading.question}
                </div>
                {deletingReading.answers && deletingReading.answers.length > 0 && (
                  <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
                    Đáp án: {deletingReading.answers.join(', ')}
                  </div>
                )}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                ⚠️ Toàn bộ đáp án liên kết của câu hỏi này trong bảng <strong>readingAnswers</strong> cũng sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingReading(null);
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.btnDeleteConfirm}
                onClick={handleDeleteReading}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminReadingsView;
