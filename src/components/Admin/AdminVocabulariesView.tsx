'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookA,
  FolderKanban,
  Sparkles,
  Languages,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Search,
  X,
  Check,
  ArrowLeft,
  ShieldCheck,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Volume2,
  RotateCcw,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import styles from './AdminVocabulariesView.module.css';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export interface ExampleItem {
  id?: string;
  vocabularyId?: string;
  example: string;
  pinyin?: string;
  vietnammeaning?: string;
  englishmeaning?: string;
  indonesiameaning?: string | null;
}

export interface VocabularyItem {
  id: string;
  lessonId: string;
  vocabulary: string;
  pinyin: string;
  vietnameseMeaning: string;
  englishMeaning: string;
  indonesiaMeaning?: string | null;
  createdAt?: string;
  updatedAt?: string;
  examples?: ExampleItem[];
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

interface AdminVocabulariesViewProps {
  onBack?: () => void;
  initialLessonId?: string;
}

export const AdminVocabulariesView: React.FC<AdminVocabulariesViewProps> = ({
  onBack,
  initialLessonId
}) => {
  const { user: currentUser, isAdmin } = useUser();
  const { t } = useLanguage();

  const [vocabularies, setVocabularies] = useState<VocabularyItem[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLessonId || 'all');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modal: Add / Edit Single Vocabulary
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState<VocabularyItem | null>(null);
  const [formLessonId, setFormLessonId] = useState('');
  const [formVocabulary, setFormVocabulary] = useState('');
  const [formPinyin, setFormPinyin] = useState('');
  const [formVietnameseMeaning, setFormVietnameseMeaning] = useState('');
  const [formEnglishMeaning, setFormEnglishMeaning] = useState('');
  const [formIndonesiaMeaning, setFormIndonesiaMeaning] = useState('');
  
  const [formExample, setFormExample] = useState('');
  const [formExamplePinyin, setFormExamplePinyin] = useState('');
  const [formExampleVietnamMeaning, setFormExampleVietnamMeaning] = useState('');
  const [formExampleEnglishMeaning, setFormExampleEnglishMeaning] = useState('');
  const [formExampleIndonesiaMeaning, setFormExampleIndonesiaMeaning] = useState('');

  // Modal: Delete Vocabulary
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVocab, setDeletingVocab] = useState<VocabularyItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal: Bulk Import Vocabularies
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDefaultLessonId, setBulkDefaultLessonId] = useState('');
  const [bulkJsonInput, setBulkJsonInput] = useState('');
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [parsedBulkVocabs, setParsedBulkVocabs] = useState<any[]>([]);

  // Fetch Vocabularies and Lessons list from Server API
  const fetchVocabulariesData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vocabularies');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.vocabularies)) {
        setVocabularies(data.vocabularies);
      }
      if (Array.isArray(data.lessons)) {
        const sortedLessons = [...data.lessons].sort((a, b) => {
          const parseNum = (name: string) => {
            if (!name) return 999999;
            const m = name.match(/(?:bài|lesson|chương|unit|đoạn|phần|tiết|第)\s*(\d+)/i) || name.match(/\d+/);
            return m ? parseInt(m[1] || m[0], 10) : 999999;
          };
          const numA = parseNum(a.lessonName);
          const numB = parseNum(b.lessonName);
          if (numA !== numB) return numA - numB;
          return (a.lessonName || '').localeCompare(b.lessonName || '', undefined, { numeric: true, sensitivity: 'base' });
        });
        setLessons(sortedLessons);
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách từ vựng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchVocabulariesData();
    }
  }, [isAdmin]);

  // Sync selectedLessonId if initialLessonId changes
  useEffect(() => {
    if (initialLessonId) {
      setSelectedLessonId(initialLessonId);
    }
  }, [initialLessonId]);

  // Audio Pronunciation using Web Speech API
  const playAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalVocabs = vocabularies.length;
    const uniqueLessonsCount = new Set(vocabularies.map(v => v.lessonId)).size;
    const withExampleCount = vocabularies.filter(v => v.examples && v.examples.length > 0 && Boolean(v.examples[0].example)).length;
    const withPinyinCount = vocabularies.filter(v => Boolean(v.pinyin?.trim())).length;
    return { totalVocabs, uniqueLessonsCount, withExampleCount, withPinyinCount };
  }, [vocabularies]);

  // Filtered Vocabularies
  const filteredVocabularies = useMemo(() => {
    return vocabularies.filter(v => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const ex = v.examples?.[0];
      const matchSearch =
        !q ||
        v.vocabulary?.toLowerCase().includes(q) ||
        v.pinyin?.toLowerCase().includes(q) ||
        v.vietnameseMeaning?.toLowerCase().includes(q) ||
        v.englishMeaning?.toLowerCase().includes(q) ||
        ex?.example?.toLowerCase().includes(q) ||
        ex?.vietnammeaning?.toLowerCase().includes(q) ||
        v.lessons?.lessonName?.toLowerCase().includes(q) ||
        v.lessons?.books?.bookName?.toLowerCase().includes(q);

      // 2. Lesson Filter
      const matchLesson =
        selectedLessonId === 'all' || v.lessonId === selectedLessonId;

      return matchSearch && matchLesson;
    });
  }, [vocabularies, searchQuery, selectedLessonId]);

  // Open Modal: Add Vocabulary
  const handleOpenAddModal = () => {
    setEditingVocab(null);
    const defaultLesson =
      selectedLessonId !== 'all' ? selectedLessonId : lessons[0]?.id || '';
    setFormLessonId(defaultLesson);
    setFormVocabulary('');
    setFormPinyin('');
    setFormVietnameseMeaning('');
    setFormEnglishMeaning('');
    setFormIndonesiaMeaning('');
    setFormExample('');
    setFormExamplePinyin('');
    setFormExampleVietnamMeaning('');
    setFormExampleEnglishMeaning('');
    setFormExampleIndonesiaMeaning('');
    setIsEditModalOpen(true);
  };

  // Open Modal: Edit Vocabulary
  const handleOpenEditModal = (v: VocabularyItem) => {
    setEditingVocab(v);
    setFormLessonId(v.lessonId);
    setFormVocabulary(v.vocabulary);
    setFormPinyin(v.pinyin || '');
    setFormVietnameseMeaning(v.vietnameseMeaning || '');
    setFormEnglishMeaning(v.englishMeaning || '');
    setFormIndonesiaMeaning(v.indonesiaMeaning || '');
    
    const ex = v.examples?.[0];
    setFormExample(ex?.example || '');
    setFormExamplePinyin(ex?.pinyin || '');
    setFormExampleVietnamMeaning(ex?.vietnammeaning || '');
    setFormExampleEnglishMeaning(ex?.englishmeaning || '');
    setFormExampleIndonesiaMeaning(ex?.indonesiameaning || '');
    setIsEditModalOpen(true);
  };

  // Save Add / Edit Vocabulary
  const handleSaveVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVocabulary.trim()) {
      alert('Vui lòng nhập Hán tự / Từ vựng');
      return;
    }
    if (!formLessonId) {
      alert('Vui lòng chọn bài học cho từ vựng');
      return;
    }

    setActionLoading(true);
    try {
      const isEditing = Boolean(editingVocab);
      const res = await fetch('/api/admin/vocabularies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditing ? 'update_vocabulary' : 'create_vocabulary',
          id: editingVocab?.id,
          lessonId: formLessonId,
          vocabulary: formVocabulary.trim(),
          pinyin: formPinyin.trim(),
          vietnameseMeaning: formVietnameseMeaning.trim(),
          englishMeaning: formEnglishMeaning.trim(),
          indonesiaMeaning: formIndonesiaMeaning.trim() || null,
          example: formExample.trim(),
          examplePinyin: formExamplePinyin.trim(),
          exampleVietnamMeaning: formExampleVietnamMeaning.trim(),
          exampleEnglishMeaning: formExampleEnglishMeaning.trim(),
          exampleIndonesiaMeaning: formExampleIndonesiaMeaning.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu từ vựng');

      showToast(
        isEditing
          ? `Đã cập nhật từ vựng "${formVocabulary}" thành công!`
          : `Đã thêm từ vựng mới "${formVocabulary}" thành công!`
      );
      setIsEditModalOpen(false);
      fetchVocabulariesData();
    } catch (err: any) {
      alert(err.message || 'Lỗi thao tác từ vựng');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete Vocabulary
  const handleConfirmDelete = async () => {
    if (!deletingVocab) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/vocabularies?id=${encodeURIComponent(deletingVocab.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xóa từ vựng');

      showToast(`Đã xóa từ vựng "${deletingVocab.vocabulary}"!`);
      setIsDeleteModalOpen(false);
      setDeletingVocab(null);
      fetchVocabulariesData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa từ vựng');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== BULK IMPORT HANDLERS ====================
  const SAMPLE_BULK_VOCAB_JSON = JSON.stringify(
    [
      {
        vocabulary: "你好",
        pinyin: "nǐ hǎo",
        vietnameseMeaning: "Xin chào",
        englishMeaning: "Hello",
        indonesiaMeaning: "Halo",
        examples: [
          {
            example: "你好！很高興認識你。",
            pinyin: "Nǐ hǎo! Hěn gāoxìng rènshí nǐ.",
            vietnammeaning: "Xin chào! Rất vui được làm quen với bạn.",
            englishmeaning: "Hello! Nice to meet you.",
            indonesiameaning: "Halo! Senang bertemu denganmu."
          }
        ]
      },
      {
        vocabulary: "謝謝",
        pinyin: "xièxie",
        vietnameseMeaning: "Cảm ơn",
        englishMeaning: "Thank you",
        indonesiaMeaning: "Terima kasih",
        examples: [
          {
            example: "謝謝你的幫忙！",
            pinyin: "Xièxie nǐ de bāngmáng!",
            vietnammeaning: "Cảm ơn sự giúp đỡ của bạn!",
            englishmeaning: "Thank you for your help!",
            indonesiameaning: "Terima kasih atas bantuanmu!"
          }
        ]
      },
      {
        vocabulary: "不客氣",
        pinyin: "bú kèqi",
        vietnameseMeaning: "Đừng khách sáo / Không có gì",
        englishMeaning: "You're welcome",
        indonesiaMeaning: "Sama-sama",
        examples: [
          {
            example: "別客氣，這是我應該做的。",
            pinyin: "Bié kèqi, zhè shì wǒ yīnggāi zuò de.",
            vietnammeaning: "Đừng khách sáo, đây là việc tôi nên làm mà.",
            englishmeaning: "You're welcome, this is what I should do.",
            indonesiameaning: "Sama-sama, ini sudah seharusnya saya lakukan."
          }
        ]
      },
      {
        vocabulary: "再見",
        pinyin: "zàijiàn",
        vietnameseMeaning: "Tạm biệt",
        englishMeaning: "Goodbye",
        indonesiaMeaning: "Selamat tinggal",
        examples: [
          {
            example: "明天見，再見！",
            pinyin: "Míngtiān jiàn, zàijiàn!",
            vietnammeaning: "Ngày mai gặp lại, tạm biệt nhé!",
            englishmeaning: "See you tomorrow, goodbye!",
            indonesiameaning: "Sampai jumpa besok, selamat tinggal!"
          }
        ]
      }
    ],
    null,
    2
  );

  const handleOpenBulkModal = () => {
    const defaultLesson =
      selectedLessonId !== 'all' ? selectedLessonId : lessons[0]?.id || '';
    setBulkDefaultLessonId(defaultLesson);
    setBulkParseError(null);
    if (!bulkJsonInput.trim()) {
      setBulkJsonInput(SAMPLE_BULK_VOCAB_JSON);
      try {
        setParsedBulkVocabs(JSON.parse(SAMPLE_BULK_VOCAB_JSON));
      } catch {
        setParsedBulkVocabs([]);
      }
    } else {
      handleJsonChange(bulkJsonInput);
    }
    setIsBulkModalOpen(true);
  };

  const handleJsonChange = (text: string) => {
    setBulkJsonInput(text);
    if (!text.trim()) {
      setBulkParseError(null);
      setParsedBulkVocabs([]);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setBulkParseError('Dữ liệu JSON phải là một mảng [] (Array các từ vựng)');
        setParsedBulkVocabs([]);
        return;
      }
      if (parsed.length === 0) {
        setBulkParseError('Mảng JSON không chứa phần tử từ vựng nào');
        setParsedBulkVocabs([]);
        return;
      }

      // Check item validity
      const invalidIndex = parsed.findIndex(
        (item: any) =>
          !item || typeof item !== 'object' || !(item.vocabulary || item.word || item.hanzi || item.chinese)
      );
      if (invalidIndex !== -1) {
        setBulkParseError(`Phần tử thứ #${invalidIndex + 1} thiếu Hán tự / Từ vựng (vocabulary / word / hanzi)`);
        setParsedBulkVocabs(parsed);
        return;
      }

      setBulkParseError(null);
      setParsedBulkVocabs(parsed);
    } catch (err: any) {
      setBulkParseError(`Cú pháp JSON không hợp lệ: ${err.message}`);
      setParsedBulkVocabs([]);
    }
  };

  const handleInsertSampleJson = () => {
    handleJsonChange(SAMPLE_BULK_VOCAB_JSON);
  };

  const handleClearJson = () => {
    setBulkJsonInput('');
    setBulkParseError(null);
    setParsedBulkVocabs([]);
  };

  const handleExecuteBulkImport = async () => {
    if (parsedBulkVocabs.length === 0) {
      alert('Vui lòng cung cấp dữ liệu JSON từ vựng hợp lệ!');
      return;
    }

    if (bulkParseError) {
      alert(`Vui lòng sửa lỗi trước khi nhập: ${bulkParseError}`);
      return;
    }

    // Check if any vocabulary lacks lessonId and no default lesson is chosen
    const missingLesson = parsedBulkVocabs.some(v => !v.lessonId && !bulkDefaultLessonId);
    if (missingLesson) {
      alert('Một số từ vựng chưa có lessonId. Vui lòng chọn "Bài học mặc định" ở mục bên trên!');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/vocabularies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_create',
          vocabularies: parsedBulkVocabs,
          defaultLessonId: bulkDefaultLessonId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi nhập hàng loạt từ vựng');

      showToast(`🎉 ${data.message || `Đã nhập thành công ${data.count} từ vựng!`}`);
      setIsBulkModalOpen(false);
      fetchVocabulariesData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nhập hàng loạt');
    } finally {
      setActionLoading(false);
    }
  };

  // Count total examples in parsed JSON
  const totalExamplesInBulk = useMemo(() => {
    return parsedBulkVocabs.reduce((acc, item) => {
      if (Array.isArray(item.examples)) {
        return acc + item.examples.length;
      }
      if (item.example && typeof item.example === 'string' && item.example.trim()) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [parsedBulkVocabs]);

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
            <h1 className={styles.title}>Quản Lý Từ Vựng</h1>
            <span className={styles.adminTag}>
              <ShieldCheck size={12} /> Admin
            </span>
          </div>
          <p className={styles.subtitle}>
            Quản trị kho từ vựng Hán tự, phiên âm Pinyin, giải nghĩa và nhập hàng loạt kèm câu ví dụ từ JSON.
          </p>
        </div>

        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={fetchVocabulariesData}
            title="Tải lại dữ liệu từ vựng"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            className={styles.btnBulk}
            onClick={handleOpenBulkModal}
            title="Nhập hàng loạt từ vựng từ JSON (kèm câu ví dụ)"
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
            <span>Thêm Từ Vựng Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <BookA size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.totalVocabs}</span>
            <span className={styles.statLabel}>Tổng số từ vựng</span>
          </div>
        </div>

        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
            <MessageSquare size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.withExampleCount}</span>
            <span className={styles.statLabel}>Từ có câu ví dụ</span>
          </div>
        </div>

        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <FolderKanban size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.uniqueLessonsCount}</span>
            <span className={styles.statLabel}>Bài học có từ vựng</span>
          </div>
        </div>

        <div className={`${styles.statCard} sketch-box`}>
          <div className={styles.statIconWrap} style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            <Languages size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.withPinyinCount}</span>
            <span className={styles.statLabel}>Có phiên âm Pinyin</span>
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
            placeholder="Tìm theo Hán tự, Pinyin, nghĩa tiếng Việt, câu ví dụ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter by Lesson */}
        <div className={styles.filtersGroup}>
          <select
            className={styles.filterSelect}
            value={selectedLessonId}
            onChange={e => setSelectedLessonId(e.target.value)}
          >
            <option value="all">Tất cả bài học ({lessons.length})</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>
                {l.lessonName} {l.books?.bookName ? `(${l.books.bookName})` : ''}
              </option>
            ))}
          </select>

          {(searchQuery || selectedLessonId !== 'all') && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSearchQuery('');
                setSelectedLessonId('all');
              }}
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={14} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Vocabularies Data Table */}
      <div className={`${styles.tableCard} sketch-box`}>
        <div className={styles.tableContainer}>
          <table className={styles.vocabTable}>
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center' }}>#</th>
                <th style={{ width: 170 }}>Hán tự / Từ vựng</th>
                <th style={{ width: 130 }}>Phiên âm (Pinyin)</th>
                <th style={{ width: 180 }}>Nghĩa từ vựng</th>
                <th style={{ minWidth: 260 }}>Câu ví dụ (Example)</th>
                <th style={{ width: 190 }}>Bài học</th>
                <th style={{ width: 90, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#2b7fd4' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Đang tải danh sách từ vựng...</p>
                  </td>
                </tr>
              ) : filteredVocabularies.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>📖</span>
                      <p className={styles.emptyText}>Không tìm thấy từ vựng nào</p>
                      <p className={styles.emptySubtext}>
                        {searchQuery || selectedLessonId !== 'all'
                          ? 'Thử thay đổi từ khóa tìm kiếm hoặc bài học đang lọc'
                          : 'Hãy bấm "Thêm Từ Vựng Mới" hoặc "Nhập hàng loạt" để bắt đầu!'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVocabularies.map((vocab, index) => {
                  const lessonName = vocab.lessons?.lessonName || 'Chưa gán bài học';
                  const bookName = vocab.lessons?.books?.bookName;
                  const firstExample = vocab.examples?.[0];

                  return (
                    <tr key={vocab.id}>
                      <td style={{ textAlign: 'center', color: '#888', fontWeight: 600 }}>
                        {index + 1}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={styles.hanziText}>{vocab.vocabulary}</span>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.soundBtn}`}
                            onClick={() => playAudio(vocab.vocabulary)}
                            title="Phát âm từ vựng"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        {vocab.pinyin ? (
                          <span className={styles.pinyinText}>{vocab.pinyin}</span>
                        ) : (
                          <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: 12 }}>Chưa có</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.meaningVi}>
                          {vocab.vietnameseMeaning || <span style={{ color: '#aaa' }}>Chưa có</span>}
                        </div>
                        {vocab.englishMeaning && (
                          <div className={styles.meaningEn}>
                            🇬🇧 {vocab.englishMeaning}
                          </div>
                        )}
                        {vocab.indonesiaMeaning && (
                          <div className={styles.meaningEn} style={{ color: '#0d9488' }}>
                            🇮🇩 {vocab.indonesiaMeaning}
                          </div>
                        )}
                      </td>
                      <td>
                        {firstExample && firstExample.example ? (
                          <div className={styles.exampleBox}>
                            <div className={styles.exampleHeaderRow}>
                              <span className={styles.exampleHanzi}>{firstExample.example}</span>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.soundBtn}`}
                                style={{ width: 22, height: 22, padding: 0 }}
                                onClick={() => playAudio(firstExample.example)}
                                title="Phát âm câu ví dụ"
                              >
                                <Volume2 size={12} />
                              </button>
                            </div>
                            {firstExample.pinyin && (
                              <span className={styles.examplePinyin}>{firstExample.pinyin}</span>
                            )}
                            {firstExample.vietnammeaning && (
                              <span className={styles.exampleMeaning}>{firstExample.vietnammeaning}</span>
                            )}
                            {firstExample.englishmeaning && (
                              <span className={styles.exampleMeaning} style={{ color: '#64748b' }}>
                                🇬🇧 {firstExample.englishmeaning}
                              </span>
                            )}
                            {firstExample.indonesiameaning && (
                              <span className={styles.exampleMeaning} style={{ color: '#0d9488' }}>
                                🇮🇩 {firstExample.indonesiameaning}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: 12 }}>— Chưa có ví dụ</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <span className={styles.lessonBadge}>
                            <FolderKanban size={11} /> {lessonName}
                          </span>
                          {bookName && (
                            <div>
                              <span className={styles.bookBadge}>
                                <BookOpen size={10} /> {bookName}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className={styles.tableActions} style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            onClick={() => handleOpenEditModal(vocab)}
                            title="Chỉnh sửa từ vựng & câu ví dụ"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={() => {
                              setDeletingVocab(vocab);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Xóa từ vựng"
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

      {/* ==================== MODAL: THÊM / SỬA TỪ VỰNG ==================== */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={`${styles.modalBox} ${styles.modalBoxWide}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingVocab ? 'Chỉnh Sửa Từ Vựng & Ví Dụ' : 'Thêm Từ Vựng Mới'}
              </h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVocab}>
              {/* Chọn bài học */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Thuộc bài học *</label>
                <select
                  className={styles.formInput}
                  value={formLessonId}
                  onChange={e => setFormLessonId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Chọn bài học --</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.lessonName} {l.books?.bookName ? `(${l.books.bookName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hán tự & Pinyin */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hán tự (Từ vựng) *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: 你好 / 學習"
                    value={formVocabulary}
                    onChange={e => setFormVocabulary(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phiên âm (Pinyin)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: nǐ hǎo"
                    value={formPinyin}
                    onChange={e => setFormPinyin(e.target.value)}
                  />
                </div>
              </div>

              {/* Nghĩa tiếng Việt */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nghĩa tiếng Việt *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ví dụ: Xin chào / Học tập"
                  value={formVietnameseMeaning}
                  onChange={e => setFormVietnameseMeaning(e.target.value)}
                  required
                />
              </div>

              {/* Nghĩa tiếng Anh & Indonesia */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nghĩa tiếng Anh (tùy chọn)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: Hello"
                    value={formEnglishMeaning}
                    onChange={e => setFormEnglishMeaning(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nghĩa tiếng Indo (tùy chọn)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: Halo"
                    value={formIndonesiaMeaning}
                    onChange={e => setFormIndonesiaMeaning(e.target.value)}
                  />
                </div>
              </div>

              {/* PHẦN CÂU VÍ DỤ (EXAMPLES) */}
              <div className={styles.sectionHeader}>
                <MessageSquare size={16} />
                <span>Câu ví dụ minh họa (Bảng public.examples)</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Câu ví dụ tiếng Trung (example)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ví dụ: 你好！很高興認識你。"
                  value={formExample}
                  onChange={e => setFormExample(e.target.value)}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phiên âm câu ví dụ (pinyin)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: Nǐ hǎo! Hěn gāoxìng rènshí nǐ."
                    value={formExamplePinyin}
                    onChange={e => setFormExamplePinyin(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nghĩa tiếng Việt của câu ví dụ (vietnammeaning)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: Xin chào! Rất vui được làm quen với bạn."
                    value={formExampleVietnamMeaning}
                    onChange={e => setFormExampleVietnamMeaning(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nghĩa tiếng Anh của ví dụ (englishmeaning)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: Hello! Nice to meet you."
                    value={formExampleEnglishMeaning}
                    onChange={e => setFormExampleEnglishMeaning(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nghĩa tiếng Indo của ví dụ (indonesiameaning)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ví dụ: Halo! Senang bertemu denganmu."
                    value={formExampleIndonesiaMeaning}
                    onChange={e => setFormExampleIndonesiaMeaning(e.target.value)}
                  />
                </div>
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
                  <span>{actionLoading ? 'Đang lưu...' : 'Lưu từ vựng'}</span>
                </button>
              </div>
            </form>
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
                  <h3 className={styles.modalTitle}>Nhập Hàng Loạt Từ Vựng & Câu Ví Dụ</h3>
                  <p className={styles.modalSubtitle}>
                    Dán chuỗi JSON danh sách từ vựng kèm câu ví dụ để thêm vào hệ thống
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

            <div>
              {/* Chọn bài học mặc định */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Bài học mặc định <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(áp dụng cho từ vựng chưa có lessonId trong JSON)</span>
                </label>
                <select
                  className={styles.formInput}
                  value={bulkDefaultLessonId}
                  onChange={e => setBulkDefaultLessonId(e.target.value)}
                >
                  <option value="">-- Chọn bài học mặc định --</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.lessonName} {l.books?.bookName ? `(${l.books.bookName})` : ''}
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
                    title="Chèn dữ liệu JSON mẫu chuẩn có kèm ví dụ"
                  >
                    <Sparkles size={13} />
                    <span>Chèn JSON mẫu có ví dụ</span>
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
                  ) : parsedBulkVocabs.length > 0 ? (
                    <span className={styles.statusBadgeSuccess}>
                      <CheckCircle2 size={13} />
                      <span>{parsedBulkVocabs.length} từ vựng ({totalExamplesInBulk} ví dụ)</span>
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
                  rows={10}
                  placeholder={`[
  {
    "vocabulary": "你好",
    "pinyin": "nǐ hǎo",
    "vietnameseMeaning": "Xin chào",
    "englishMeaning": "Hello",
    "indonesiaMeaning": "Halo",
    "examples": [
      {
        "example": "你好！很高興認識你。",
        "pinyin": "Nǐ hǎo! Hěn gāoxìng rènshí nǐ.",
        "vietnammeaning": "Xin chào! Rất vui được làm quen với bạn.",
        "englishmeaning": "Hello! Nice to meet you.",
        "indonesiameaning": "Halo! Senang bertemu denganmu."
      }
    ]
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

              {/* Warning if missing lessonId */}
              {!bulkParseError &&
                parsedBulkVocabs.length > 0 &&
                !bulkDefaultLessonId &&
                parsedBulkVocabs.some(v => !v.lessonId) && (
                  <div className={styles.jsonWarningAlert}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Cảnh báo:</strong> Một số từ vựng chưa có <code>lessonId</code>. Vui lòng chọn <strong>Bài học mặc định</strong> ở trên để tự động gán!
                    </div>
                  </div>
                )}

              {/* Live Preview of parsed items */}
              {!bulkParseError && parsedBulkVocabs.length > 0 && (
                <div className={styles.jsonPreviewBox}>
                  <div className={styles.previewHeader}>
                    <span style={{ fontWeight: 800 }}>
                      Xem trước ({parsedBulkVocabs.length} từ vựng, {totalExamplesInBulk} câu ví dụ):
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Tự động liên kết vào bảng vocabularies & examples
                    </span>
                  </div>
                  <div className={styles.previewChipsList}>
                    {parsedBulkVocabs.slice(0, 20).map((item, idx) => {
                      const word = item.vocabulary || item.word || item.hanzi || item.chinese || `Từ #${idx + 1}`;
                      const pinyin = item.pinyin || '';
                      const meaning = item.vietnameseMeaning || item.meaning || item.vietnamMeaning || item.vietnamese || '';
                      const hasExample = (Array.isArray(item.examples) && item.examples.length > 0) || Boolean(item.example);
                      const exCount = Array.isArray(item.examples) ? item.examples.length : (item.example ? 1 : 0);

                      return (
                        <div key={idx} className={styles.previewChip}>
                          <span className={styles.previewChipWord}>{word}</span>
                          {pinyin && <span className={styles.previewChipPinyin}>{pinyin}</span>}
                          {meaning && <span className={styles.previewChipMeaning}>({meaning})</span>}
                          {hasExample && (
                            <span className={styles.previewChipExample}>
                              📝 {exCount} ví dụ
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {parsedBulkVocabs.length > 20 && (
                      <div className={styles.previewChipMore}>
                        +{parsedBulkVocabs.length - 20} từ khác...
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
                disabled={actionLoading || parsedBulkVocabs.length === 0 || Boolean(bulkParseError)}
              >
                <Check size={16} />
                <span>
                  {actionLoading
                    ? 'Đang nhập...'
                    : `Nhập ${parsedBulkVocabs.length > 0 ? `${parsedBulkVocabs.length} từ vựng` : 'hàng loạt'}${
                        totalExamplesInBulk > 0 ? ` & ${totalExamplesInBulk} ví dụ` : ''
                      }`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: XÁC NHẬN XÓA ==================== */}
      {isDeleteModalOpen && deletingVocab && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#c23838' }}>
                Xác nhận xóa từ vựng
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
              Bạn có chắc chắn muốn xóa từ vựng <strong style={{ fontSize: 16, color: '#1e1b4b' }}>"{deletingVocab.vocabulary}"</strong> ({deletingVocab.pinyin || ''}) khỏi bài học không?
              {deletingVocab.examples && deletingVocab.examples.length > 0 && (
                <span style={{ display: 'block', marginTop: 8, color: '#c23838', fontWeight: 700 }}>
                  ⚠️ Các câu ví dụ đi kèm của từ này trong bảng examples cũng sẽ bị xóa.
                </span>
              )}
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
                <span>{actionLoading ? 'Đang xóa...' : 'Xóa từ vựng'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
