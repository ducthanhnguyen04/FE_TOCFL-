import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  Edit3, 
  Plus, 
  X, 
  ChevronLeft, 
  Trash2, 
  Printer, 
  Save, 
  Play, 
  FolderInput, 
  Edit2 
} from 'lucide-react';
import styles from './MyVocabView.module.css';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import { LessonDetail } from '../LessonDetail/LessonDetail';
import { PracticeSheetModal } from '../Modal/PracticeSheetModal';

export interface MyVocabSet {
  id: string;
  name: string;
  userId: string;
  vocabCount?: number;
}

export interface MyVocabItem {
  id?: string;
  vocabulary: string;
  pinyin: string;
  meaning: string;
  example?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  setId: string;
  userId: string;
}

export const MyVocabView: React.FC = () => {
  const { user, openLoginModal } = useUser();
  const { t } = useLanguage();
  const [sets, setSets] = useState<MyVocabSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [activeSet, setActiveSet] = useState<MyVocabSet | null>(null);
  const [vocabList, setVocabList] = useState<MyVocabItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 1. Tải danh sách các bộ từ vựng
  const fetchSets = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('myVocabSets')
      .select('*, myVocabularies(count)')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (data) {
      const formatted = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        userId: item.userId,
        vocabCount: item.myVocabularies?.[0]?.count || 0
      }));
      setSets(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchSets();
    } else {
      setSets([]);
      setActiveSet(null);
    }
  }, [user]);

  // 2. Tạo bộ từ vựng mới
  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim() || !user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('myVocabSets')
      .insert([
        { name: newSetName.trim(), userId: user.id }
      ])
      .select()
      .single();

    if (data) {
      setSets(prev => [data, ...prev]);
      setNewSetName('');
      setIsCreateModalOpen(false);
      // Mở ngay bộ vừa tạo để nhập từ
      setActiveSet(data);
      setVocabList([
        {
          vocabulary: '',
          pinyin: '',
          meaning: '',
          example: '',
          examplePinyin: '',
          exampleMeaning: '',
          setId: data.id,
          userId: user.id
        }
      ]);
    } else if (error) {
      showToast('❌ Không thể tạo bộ từ vựng: ' + error.message);
    }
  };

  // 3. Xoá bộ từ vựng
  const handleDeleteSet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('myvocab.deleteConfirm'))) return;

    const supabase = createClient();
    const { error } = await supabase.from('myVocabSets').delete().eq('id', id);
    if (!error) {
      setSets(prev => prev.filter(s => s.id !== id));
      if (activeSet?.id === id) setActiveSet(null);
      showToast(t('myvocab.deleteSuccess'));
    } else {
      showToast('❌ ' + error.message);
    }
  };

  // 4. Mở chi tiết bộ từ vựng để sửa
  const handleOpenSet = async (set: MyVocabSet) => {
    setActiveSet(set);
    setIsStudyMode(false);
    const supabase = createClient();
    const { data } = await supabase
      .from('myVocabularies')
      .select('*')
      .eq('setId', set.id)
      .order('createdAt', { ascending: true });

    if (data && data.length > 0) {
      setVocabList(data);
    } else {
      setVocabList([
        {
          vocabulary: '',
          pinyin: '',
          meaning: '',
          example: '',
          examplePinyin: '',
          exampleMeaning: '',
          setId: set.id,
          userId: user?.id || ''
        }
      ]);
    }
  };

  // 4b. Bấm trực tiếp vào thẻ để vào học ngay
  const handleStartStudyFromCard = async (set: MyVocabSet) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('myVocabularies')
      .select('*')
      .eq('setId', set.id)
      .order('createdAt', { ascending: true });

    const validItems = (data || []).filter((v: any) => v.vocabulary?.trim());
    if (validItems.length === 0) {
      showToast(t('myvocab.emptySetAlert'));
      return;
    }

    setActiveSet(set);
    setVocabList(validItems);
    setIsStudyMode(true);
  };

  // 5. Thêm dòng từ vựng mới
  const handleAddRow = () => {
    if (!activeSet || !user) return;
    setVocabList(prev => [
      ...prev,
      {
        vocabulary: '',
        pinyin: '',
        meaning: '',
        example: '',
        examplePinyin: '',
        exampleMeaning: '',
        setId: activeSet.id,
        userId: user.id
      }
    ]);
  };

  // 6. Xoá dòng từ vựng
  const handleDeleteRow = (index: number) => {
    setVocabList(prev => prev.filter((_, i) => i !== index));
  };

  // 7. Cập nhật giá trị ô input
  const handleUpdateRow = (index: number, field: keyof MyVocabItem, val: string) => {
    setVocabList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // 8. Lưu từ vựng vào Supabase
  const handleSaveVocabularies = async () => {
    if (!activeSet || !user) return;
    setIsSaving(true);
    const supabase = createClient();

    // Lọc các từ hợp lệ (ít nhất có vocabulary hoặc meaning)
    const validItems = vocabList.filter(item => item.vocabulary.trim() || item.meaning.trim());

    // Xóa từ cũ trong set và chèn lại (hoặc upsert)
    await supabase.from('myVocabularies').delete().eq('setId', activeSet.id);

    if (validItems.length > 0) {
      const itemsToInsert = validItems.map(item => ({
        vocabulary: item.vocabulary.trim(),
        pinyin: item.pinyin.trim(),
        meaning: item.meaning.trim(),
        example: item.example?.trim() || null,
        examplePinyin: item.examplePinyin?.trim() || null,
        exampleMeaning: item.exampleMeaning?.trim() || null,
        setId: activeSet.id,
        userId: user.id
      }));

      const { error } = await supabase.from('myVocabularies').insert(itemsToInsert);
      if (error) {
        showToast('❌ ' + error.message);
      } else {
        showToast(t('myvocab.saveSuccess'));
        fetchSets();
      }
    } else {
      showToast(t('myvocab.saveEmptySuccess'));
      fetchSets();
    }
    setIsSaving(false);
  };

  // NẾU CHƯA ĐĂNG NHẬP: Hiển thị giao diện như Ảnh 1
  if (!user) {
    return (
      <div className={styles.vocabWrapper}>
        <div className={styles.headerTitleArea}>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon}>📚</span>
            <h1 className={styles.title}>{t('myvocab.title')}</h1>
          </div>
          <p className={styles.subtitle}>
            {t('myvocab.subtitle')}
          </p>
        </div>

        <div className={`${styles.authBox} sketch-cross`}>
          <div className={styles.authIcon}>
            <LogIn size={26} color="#222" />
          </div>
          <h2 className={styles.authTitle}>{t('myvocab.loginTitle')}</h2>
          <p className={styles.authSubtitle}>
            {t('myvocab.loginSubtitle')}
          </p>
          <button className={`${styles.loginBtn} sketch-cross`} onClick={openLoginModal}>
            <LogIn size={16} />
            <span>{t('header.login')}</span>
          </button>
        </div>
      </div>
    );
  }

  // NẾU BẤM "BẮT ĐẦU HỌC": CHUYỂN SANG HỌC BÀI VỚI ĐỦ CÁC CHẾ ĐỘ
  if (activeSet && isStudyMode) {
    const formattedStudyVocabs = vocabList
      .filter(v => v.vocabulary.trim())
      .map((v, idx) => ({
        id: v.id || idx,
        hanzi: v.vocabulary,
        pinyin: v.pinyin,
        vietnameseMeaning: v.meaning,
        englishMeaning: '',
        indonesiaMeaning: '',
        tag: t('myvocab.tag'),
        example: v.example || null,
        examplePinyin: v.examplePinyin || null,
        exampleVietnamMeaning: v.exampleMeaning || null,
        exampleEnglishMeaning: null,
        exampleIndonesiaMeaning: null
      }));

    return (
      <div className={styles.vocabWrapper}>
        <LessonDetail
          customTitle={activeSet.name}
          customVocabs={formattedStudyVocabs}
          onBack={() => setIsStudyMode(false)}
        />
      </div>
    );
  }

  // ĐÃ ĐĂNG NHẬP: MÀN HÌNH CHI TIẾT SỬA BỘ TỪ (như Ảnh 5)
  if (activeSet) {
    const validCount = vocabList.filter(v => v.vocabulary.trim()).length;
    const filteredVocab = vocabList.filter(v => 
      !searchKeyword ||
      v.vocabulary.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      v.pinyin.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      v.meaning.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    return (
      <div className={styles.vocabWrapper}>
        {toastMessage && (
          <div className={styles.toast}>
            <span>{toastMessage}</span>
          </div>
        )}

        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={() => { setActiveSet(null); fetchSets(); }}>
            <ChevronLeft size={16} />
            <span>{t('myvocab.title')}</span>
          </button>
          <div className={styles.detailSubtitle}>
            {validCount} {t('myvocab.validWords')}
          </div>
          <div className={styles.detailTitleRow}>
            <div className={styles.detailTitleLeft}>
              <span style={{ fontSize: 28 }}>📚</span>
              <h1 className={styles.title}>{activeSet.name}</h1>
            </div>
            <div className={styles.detailActions}>
              <button 
                className={`${styles.detailBtn} sketch-cross`} 
                onClick={() => {
                  if (validCount === 0) {
                    showToast(t('myvocab.noWordsToPrint'));
                    return;
                  }
                  setIsPrintModalOpen(true);
                }}
              >
                <Printer size={15} />
                <span>{t('myvocab.print')}</span>
              </button>
              <button 
                className={`${styles.detailBtn} ${styles.detailBtnPrimary} sketch-cross`} 
                onClick={handleSaveVocabularies}
                disabled={isSaving}
              >
                <Save size={15} />
                <span>{isSaving ? t('myvocab.saving') : t('myvocab.save')}</span>
              </button>
              <button 
                className={`${styles.detailBtn} ${styles.detailBtnPlay} sketch-cross`} 
                onClick={() => {
                  if (validCount === 0) {
                    showToast(t('myvocab.noWordsToStudy'));
                    return;
                  }
                  setIsStudyMode(true);
                }}
              >
                <Play size={15} fill="currentColor" />
                <span>{t('myvocab.startStudy')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bảng nhập từ vựng */}
        <div className={`${styles.tableContainer} sketch-box`}>
          <div className={styles.searchWrap}>
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder={t('myvocab.searchPlaceholder')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          <div className={styles.tableHeader}>
            <span>#</span>
            <span>{t('myvocab.colChar')}</span>
            <span>{t('myvocab.colPinyin')}</span>
            <span>{t('myvocab.colMeaning')}</span>
            <span></span>
          </div>

          <div className={styles.tableBody}>
            {filteredVocab.map((item, idx) => (
              <div key={idx} className={styles.vocabRow}>
                <div className={styles.mainInputsRow}>
                  <span className={styles.rowNum}>{idx + 1}</span>
                  <input 
                    type="text"
                    className={styles.tableInput}
                    placeholder={t('myvocab.charPlaceholder')}
                    value={item.vocabulary}
                    onChange={(e) => handleUpdateRow(idx, 'vocabulary', e.target.value)}
                  />
                  <input 
                    type="text"
                    className={styles.tableInput}
                    placeholder={t('myvocab.pinyinPlaceholder')}
                    value={item.pinyin}
                    onChange={(e) => handleUpdateRow(idx, 'pinyin', e.target.value)}
                  />
                  <input 
                    type="text"
                    className={styles.tableInput}
                    placeholder={t('myvocab.colMeaning')}
                    value={item.meaning}
                    onChange={(e) => handleUpdateRow(idx, 'meaning', e.target.value)}
                  />
                  <button 
                    type="button" 
                    className={styles.deleteRowBtn} 
                    onClick={() => handleDeleteRow(idx)}
                    title={t('myvocab.deleteRowTitle')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className={styles.exampleInputsRow}>
                  <input 
                    type="text"
                    className={styles.tableInput}
                    placeholder={t('myvocab.exampleZh')}
                    value={item.example || ''}
                    onChange={(e) => handleUpdateRow(idx, 'example', e.target.value)}
                  />
                  <input 
                    type="text"
                    className={styles.tableInput}
                    placeholder={t('myvocab.exampleMeaning')}
                    value={item.exampleMeaning || ''}
                    onChange={(e) => handleUpdateRow(idx, 'exampleMeaning', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.addVocabBtnRow}>
            <button type="button" className={styles.addVocabBtn} onClick={handleAddRow}>
              <Plus size={16} />
              <span>{t('myvocab.addWord')}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button 
            className={`${styles.detailBtn} sketch-cross`} 
            onClick={() => {
              if (validCount === 0) {
                showToast(t('myvocab.noWordsToPrint'));
                return;
              }
              setIsPrintModalOpen(true);
            }}
          >
            <Printer size={15} />
            <span>{t('myvocab.print')}</span>
          </button>
          <button 
            className={`${styles.detailBtn} ${styles.detailBtnPrimary} sketch-cross`} 
            onClick={handleSaveVocabularies}
            disabled={isSaving}
          >
            <Save size={15} />
            <span>{isSaving ? t('myvocab.saving') : t('myvocab.save')}</span>
          </button>
          <button 
            className={`${styles.detailBtn} ${styles.detailBtnPlay} sketch-cross`} 
            onClick={() => {
              if (validCount === 0) {
                showToast(t('myvocab.noWordsToStudy'));
                return;
              }
              setIsStudyMode(true);
            }}
          >
            <Play size={15} fill="currentColor" />
            <span>{t('myvocab.startStudy')}</span>
          </button>
        </div>

        {/* Modal Xem trước và In bảng luyện viết A4 */}
        <PracticeSheetModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          items={vocabList
            .filter(v => v.vocabulary.trim())
            .map(v => ({
              char: v.vocabulary,
              pinyin: v.pinyin,
              meaning: v.meaning
            }))}
        />
      </div>
    );
  }

  // ĐÃ ĐĂNG NHẬP: MÀN HÌNH DANH SÁCH BỘ TỪ (như Ảnh 2 & 4)
  return (
    <div className={styles.vocabWrapper}>
      {toastMessage && (
        <div className={styles.toast}>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className={styles.headerTitleArea}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>📚</span>
          <h1 className={styles.title}>{t('myvocab.title')}</h1>
        </div>
        <p className={styles.subtitle}>
          {t('myvocab.subtitle')}
        </p>
      </div>

      <div className={styles.topActionRow}>
        <button className={`${styles.createSetBtn} sketch-cross`} onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} />
          <span>{t('myvocab.createSet')}</span>
        </button>
      </div>

      {sets.length === 0 ? (
        // Ảnh 2: Chưa có bộ từ vựng nào
        <div className={`${styles.emptyBox} sketch-cross`}>
          <div className={styles.emptyIcon}>
            <Edit3 size={26} color="#222" />
          </div>
          <h2 className={styles.emptyTitle}>{t('myvocab.emptyTitle')}</h2>
          <p className={styles.emptySubtitle}>
            {t('myvocab.emptySubtitle')}
          </p>
          <button className={`${styles.createSetBtn} sketch-cross`} onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            <span>{t('myvocab.createSet')}</span>
          </button>
        </div>
      ) : (
        // Ảnh 4: Danh sách các bộ từ vựng
        <div className={styles.setsGrid}>
          {sets.map((set) => (
            <div key={set.id} className={`${styles.setCard} sketch-cross`}>
              <div 
                className={styles.cardClickableArea} 
                onClick={() => handleStartStudyFromCard(set)}
                title={t('myvocab.clickToStudy')}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <Edit3 size={22} color="#222" />
                  </div>
                  <div className={styles.cardMeta}>
                    <h3 className={styles.setName}>{set.name}</h3>
                    <p className={styles.setCount}>{set.vocabCount || 0} {t('myvocab.vocabCount')}</p>
                  </div>
                </div>

                <div className={styles.progressWrap}>
                  <div className={styles.progressHeader}>
                    <span>{t('myvocab.progress')}</span>
                    <span>0%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '0%' }} />
                  </div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button className={styles.cardActionBtn} onClick={() => handleOpenSet(set)}>
                  <Edit2 size={14} />
                  <span>{t('myvocab.edit')}</span>
                </button>
                <button 
                  className={`${styles.cardActionBtn} ${styles.cardActionDelete}`} 
                  onClick={(e) => handleDeleteSet(set.id, e)}
                >
                  <Trash2 size={14} />
                  <span>{t('myvocab.delete')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ảnh 3: Modal tạo bộ từ vựng mới */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={`${styles.modalContent} sketch-box`} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setIsCreateModalOpen(false)}>
              <X size={18} />
            </button>
            <h3 className={styles.modalTitle}>{t('myvocab.createNewSet')}</h3>
            <form onSubmit={handleCreateSet}>
              <input
                type="text"
                className={styles.modalInput}
                placeholder={t('myvocab.setNamePlaceholder')}
                value={newSetName}
                onChange={e => setNewSetName(e.target.value)}
                autoFocus
              />
              <div className={styles.modalBtns}>
                <button 
                  type="button" 
                  className={styles.btnCancel} 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  {t('myvocab.cancel')}
                </button>
                <button 
                  type="submit" 
                  className={`${styles.btnSubmit} ${newSetName.trim() ? styles.btnSubmitActive : ''}`}
                  disabled={!newSetName.trim()}
                >
                  {t('myvocab.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
