'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  Sparkles,
  Send,
  Volume2,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronLeft,
  Lightbulb,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import styles from './RoleplayView.module.css';
import { useLanguage } from '@/providers/LanguageProvider';

type Level = 'beginner' | 'intermediate' | 'advanced';

interface Sentence {
  hanzi: string;
  pinyin: string;
  translation: string;
}

interface Correction {
  original: string;
  corrected: string;
  pinyin?: string;
  explanation: string;
}

interface VocabularyItem {
  word: string;
  pinyin: string;
  meaning: string;
}

interface ChatItem {
  role: 'user' | 'ai';
  text: string;
  sentence?: Sentence;
  correction?: Correction | null;
  keyVocabulary?: VocabularyItem[];
}

const TEXT = {
  vi: {
    title: 'Hội thoại nhập vai (會話)',
    subtitle: 'Tự chọn chủ đề & vai — gia sư AI nhập vai trò chuyện, sửa lỗi & gợi ý',
    quickLabel: 'Gợi ý nhanh (bấm để điền, vẫn sửa được)',
    topicLabel: 'Chủ đề / tình huống',
    topicPh: 'VD: Gọi món ở quán ăn, Phỏng vấn xin việc, Hỏi đường...',
    partnerLabel: 'Bạn nói chuyện với ai?',
    partnerPh: 'VD: Nhân viên phục vụ, Bạn thân, Nhà tuyển dụng...',
    levelLabel: 'Trình độ',
    beginner: 'Sơ cấp',
    intermediate: 'Trung cấp',
    advanced: 'Cao cấp',
    start: 'Bắt đầu trò chuyện',
    footnote: 'Gia sư AI sẽ chào mở màn theo vai bạn chọn. Được hỗ trợ bởi Gemini.',
    back: 'Đổi chủ đề',
    restart: 'Làm lại',
    you: 'Bạn',
    inputPh: 'Nhập câu trả lời bằng tiếng Trung (hoặc tiếng Việt nếu bí)...',
    suggestions: 'Gợi ý trả lời',
    correction: 'Sửa lỗi',
    thinking: 'đang soạn câu trả lời...',
    error: '❌ AI đang bận, vui lòng thử lại sau ít phút.',
    showTrans: 'Hiện nghĩa',
    hideTrans: 'Ẩn nghĩa',
    scenarioBox: 'TÌNH HUỐNG',
    supportBox: 'HỖ TRỢ',
    optPinyin: 'Phiên âm',
    optSuggestions: 'Gợi ý trả lời',
    optTranslation: 'Dịch tiếng Việt',
    optCorrection: 'Sửa lỗi',
    vocabBox: 'TỪ VỰNG TRONG BÀI',
    noVocab: 'Chưa có từ nào.',
    roleplaying: 'đang nhập vai',
    endBtn: 'Kết thúc',
    quick: [
      { icon: '🍜', topic: 'Gọi món ở quán ăn Đài Loan', partner: 'Nhân viên phục vụ' },
      { icon: '💼', topic: 'Phỏng vấn xin việc', partner: 'Nhà tuyển dụng' },
      { icon: '🧭', topic: 'Hỏi đường đến ga MRT', partner: 'Người đi đường' },
      { icon: '🛍️', topic: 'Mua quần áo ở chợ đêm', partner: 'Chủ sạp hàng' },
      { icon: '🏨', topic: 'Nhận phòng khách sạn', partner: 'Lễ tân khách sạn' },
      { icon: '🧋', topic: 'Rủ bạn đi chơi cuối tuần', partner: 'Bạn thân' }
    ]
  },
  en: {
    title: 'Roleplay Conversation (會話)',
    subtitle: 'Pick a topic & role — the AI tutor roleplays, corrects mistakes & gives hints',
    quickLabel: 'Quick ideas (click to fill, still editable)',
    topicLabel: 'Topic / situation',
    topicPh: 'E.g. Ordering food, Job interview, Asking for directions...',
    partnerLabel: 'Who are you talking to?',
    partnerPh: 'E.g. Waiter, Best friend, Recruiter...',
    levelLabel: 'Level',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    start: 'Start conversation',
    footnote: 'The AI tutor will open the conversation in the chosen role. Powered by Gemini.',
    back: 'Change topic',
    restart: 'Restart',
    you: 'You',
    inputPh: 'Type your reply in Chinese...',
    suggestions: 'Suggested replies',
    correction: 'Correction',
    thinking: 'is typing...',
    error: '❌ The AI is busy, please try again in a moment.',
    showTrans: 'Show meaning',
    hideTrans: 'Hide meaning',
    scenarioBox: 'SITUATION',
    supportBox: 'ASSISTANCE',
    optPinyin: 'Pinyin',
    optSuggestions: 'Suggested replies',
    optTranslation: 'English translation',
    optCorrection: 'Corrections',
    vocabBox: 'VOCABULARY IN LESSON',
    noVocab: 'No vocabulary yet.',
    roleplaying: 'roleplaying',
    endBtn: 'End',
    quick: [
      { icon: '🍜', topic: 'Ordering at a Taiwanese restaurant', partner: 'Waiter' },
      { icon: '💼', topic: 'Job interview', partner: 'Recruiter' },
      { icon: '🧭', topic: 'Asking the way to the MRT station', partner: 'Passer-by' },
      { icon: '🛍️', topic: 'Buying clothes at a night market', partner: 'Stall owner' },
      { icon: '🏨', topic: 'Checking in at a hotel', partner: 'Receptionist' },
      { icon: '🧋', topic: 'Inviting a friend out this weekend', partner: 'Best friend' }
    ]
  },
  id: {
    title: 'Percakapan Bermain Peran (會話)',
    subtitle: 'Pilih topik & peran — tutor AI bermain peran, mengoreksi & memberi saran',
    quickLabel: 'Ide cepat (klik untuk mengisi, tetap bisa diubah)',
    topicLabel: 'Topik / situasi',
    topicPh: 'Cth: Memesan makanan, Wawancara kerja, Menanyakan arah...',
    partnerLabel: 'Anda berbicara dengan siapa?',
    partnerPh: 'Cth: Pelayan, Sahabat, Perekrut...',
    levelLabel: 'Tingkat',
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Mahir',
    start: 'Mulai percakapan',
    footnote: 'Tutor AI akan membuka percakapan sesuai peran pilihan Anda. Didukung oleh Gemini.',
    back: 'Ganti topik',
    restart: 'Ulangi',
    you: 'Anda',
    inputPh: 'Ketik balasan dalam bahasa Mandarin...',
    suggestions: 'Saran balasan',
    correction: 'Koreksi',
    thinking: 'sedang mengetik...',
    error: '❌ AI sedang sibuk, silakan coba lagi sebentar lagi.',
    showTrans: 'Tampilkan arti',
    hideTrans: 'Sembunyikan arti',
    scenarioBox: 'SITUASI',
    supportBox: 'BANTUAN',
    optPinyin: 'Pinyin',
    optSuggestions: 'Saran balasan',
    optTranslation: 'Terjemahan Indonesia',
    optCorrection: 'Koreksi',
    vocabBox: 'KOSAKATA DALAM PELAJARAN',
    noVocab: 'Belum ada kosakata.',
    roleplaying: 'sedang bermain peran',
    endBtn: 'Selesai',
    quick: [
      { icon: '🍜', topic: 'Memesan di restoran Taiwan', partner: 'Pelayan' },
      { icon: '💼', topic: 'Wawancara kerja', partner: 'Perekrut' },
      { icon: '🧭', topic: 'Menanyakan jalan ke stasiun MRT', partner: 'Pejalan kaki' },
      { icon: '🛍️', topic: 'Membeli baju di pasar malam', partner: 'Pemilik lapak' },
      { icon: '🏨', topic: 'Check-in di hotel', partner: 'Resepsionis' },
      { icon: '🧋', topic: 'Mengajak teman jalan akhir pekan', partner: 'Sahabat' }
    ]
  }
};

const LEVELS: { id: Level; tag: string; cls: string }[] = [
  { id: 'beginner', tag: '初級', cls: 'tagGreen' },
  { id: 'intermediate', tag: '中級', cls: 'tagYellow' },
  { id: 'advanced', tag: '高級', cls: 'tagRed' }
];

export const RoleplayView: React.FC = () => {
  const { lang } = useLanguage();
  const tx = TEXT[lang as keyof typeof TEXT] || TEXT.vi;

  const [topic, setTopic] = useState('');
  const [partner, setPartner] = useState('');
  const [level, setLevel] = useState<Level>('beginner');

  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [suggestions, setSuggestions] = useState<Sentence[]>([]);
  const [input, setInput] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showCorrection, setShowCorrection] = useState(true);
  const [allVocabs, setAllVocabs] = useState<VocabularyItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const canStart = topic.trim() && partner.trim();

  const playAudio = (text: string) => {
    if (!text) return;
    audioRef.current?.pause();
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const callAI = async (history: ChatItem[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          partner,
          level,
          lang,
          messages: history.map(m => ({ role: m.role, text: m.text }))
        })
      });
      if (!res.ok) throw new Error('AI error');
      const data = await res.json();

      setMessages(prev => {
        const copy = [...prev];
        // Gắn phần sửa lỗi vào tin nhắn cuối cùng của người dùng
        if (data.correction && copy.length > 0 && copy[copy.length - 1].role === 'user') {
          copy[copy.length - 1] = { ...copy[copy.length - 1], correction: data.correction };
        }
        copy.push({
          role: 'ai',
          text: data.reply.hanzi,
          sentence: data.reply,
          keyVocabulary: data.keyVocabulary || []
        });
        return copy;
      });

      if (Array.isArray(data.keyVocabulary) && data.keyVocabulary.length > 0) {
        setAllVocabs(prev => {
          const map = new Map<string, VocabularyItem>();
          prev.forEach(v => map.set(v.word, v));
          data.keyVocabulary.forEach((v: VocabularyItem) => {
            if (v && v.word && !map.has(v.word)) {
              map.set(v.word, v);
            }
          });
          return Array.from(map.values());
        });
      }

      setSuggestions(data.suggestions || []);
      playAudio(data.reply.hanzi);
    } catch {
      setError(tx.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    if (!canStart) return;
    setIsChatting(true);
    setMessages([]);
    setSuggestions([]);
    setAllVocabs([]);
    callAI([]);
  };

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;
    const next: ChatItem[] = [...messages, { role: 'user', text: content }];
    setMessages(next);
    setInput('');
    setSuggestions([]);
    callAI(next);
  };

  const handleRestart = () => {
    setMessages([]);
    setSuggestions([]);
    setAllVocabs([]);
    callAI([]);
  };

  // ======================= CHAT SCREEN =======================
  if (isChatting) {
    const selectedQuick = tx.quick.find(q => q.topic === topic);
    const situationIcon = selectedQuick?.icon || '🍜';

    return (
      <div className={styles.chatPageLayout}>
        {/* CỘT TRÁI: KHUNG CHAT CHÍNH */}
        <div className={styles.mainChatColumn}>
          {/* Header trong khung chat */}
          <div className={`${styles.chatInnerHeader} sketch-box`}>
            <div className={styles.headerPartnerArea}>
              <div className={styles.partnerIconBox}>{situationIcon}</div>
              <div className={styles.partnerTextGroup}>
                <div className={styles.partnerName}>{partner}</div>
                <div className={styles.partnerStatus}>
                  {partner} · {tx.roleplaying}
                </div>
              </div>
            </div>
            <button className={`${styles.endBtn} sketch-box`} onClick={() => setIsChatting(false)}>
              {tx.endBtn}
            </button>
          </div>

          {/* Hộp tin nhắn */}
          <div className={`${styles.chatBox} sketch-box`}>
            <div className={styles.messages}>
              {messages.map((m, idx) =>
                m.role === 'ai' ? (
                  <div key={idx} className={styles.rowAi}>
                    <div className={styles.avatarAi}>{situationIcon}</div>
                    <div className={`${styles.bubble} ${styles.bubbleAi} sketch-box`}>
                      <div className={styles.hanziLine}>
                        <span className={styles.hanzi}>{m.sentence?.hanzi}</span>
                      </div>
                      {showPinyin && m.sentence?.pinyin && (
                        <div className={styles.pinyin}>{m.sentence?.pinyin}</div>
                      )}
                      {showTranslation && m.sentence?.translation && (
                        <div className={styles.translation}>{m.sentence?.translation}</div>
                      )}
                      <div className={styles.msgActions}>
                        <button
                          className={styles.msgActionBtn}
                          onClick={() => playAudio(m.sentence?.hanzi || '')}
                          title="Phát âm"
                        >
                          <Volume2 size={15} />
                        </button>
                        <button
                          className={`${styles.msgActionBtn} ${showTranslation ? styles.msgActionBtnActive : ''}`}
                          onClick={() => setShowTranslation(v => !v)}
                          title={showTranslation ? tx.hideTrans : tx.showTrans}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700 }}>文A</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className={styles.rowUser}>
                    <div className={styles.userCol}>
                      <div className={`${styles.bubble} ${styles.bubbleUser} sketch-box`}>{m.text}</div>
                      {showCorrection && m.correction && (
                        <div className={`${styles.correctionBox} sketch-box`}>
                          <div className={styles.correctionTitle}>
                            <CheckCircle2 size={14} /> {tx.correction}
                          </div>
                          <div className={styles.correctionWrong}>{m.correction.original}</div>
                          <div className={styles.correctionRight}>
                            <span>{m.correction.corrected}</span>
                            <button className={styles.speakBtn} onClick={() => playAudio(m.correction!.corrected)}>
                              <Volume2 size={14} />
                            </button>
                          </div>
                          {showPinyin && m.correction.pinyin && (
                            <div className={styles.pinyin}>{m.correction.pinyin}</div>
                          )}
                          <div className={styles.correctionExplain}>{m.correction.explanation}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {isLoading && (
                <div className={styles.rowAi}>
                  <div className={styles.avatarAi}>{situationIcon}</div>
                  <div className={`${styles.bubble} ${styles.bubbleAi} ${styles.typing} sketch-box`}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.typingText}>{partner} {tx.thinking}</span>
                  </div>
                </div>
              )}

              {error && <div className={styles.errorBox}>{error}</div>}
              <div ref={chatEndRef} />
            </div>

            {/* Khối gợi ý trả lời (nếu toggle gợi ý trả lời đang bật) */}
            {showSuggestions && suggestions.length > 0 && !isLoading && (
              <div className={styles.suggestArea}>
                <div className={styles.suggestTitle}>
                  <Lightbulb size={14} /> {tx.suggestions}
                </div>
                <div className={styles.suggestList}>
                  {suggestions.map((s, i) => (
                    <button key={i} className={`${styles.suggestChip} sketch-box`} onClick={() => setInput(s.hanzi)}>
                      <span className={styles.suggestHanzi}>{s.hanzi}</span>
                      {showPinyin && <span className={styles.suggestPinyin}>{s.pinyin}</span>}
                      {showTranslation && <span className={styles.suggestTrans}>{s.translation}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thanh nhập câu trả lời */}
            <form
              className={styles.inputRow}
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
            >
              <button
                type="button"
                className={`${styles.micBtn} sketch-box`}
                onClick={() => {
                  if (suggestions.length > 0) {
                    setInput(suggestions[0].hanzi);
                  }
                }}
                title="Gợi ý điền nhanh"
              >
                <Volume2 size={18} />
              </button>
              <input
                id="roleplay-input"
                className={styles.chatInput}
                placeholder={tx.inputPh}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                id="roleplay-send"
                type="submit"
                className={`${styles.sendBtn} sketch-box`}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 size={18} className={styles.spin} /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: TÌNH HUỐNG, HỖ TRỢ (CÀI ĐẶT), VÀ TỪ VỰNG TRONG BÀI */}
        <aside className={styles.sidePanelsColumn}>
          {/* Panel 1: TÌNH HUỐNG */}
          <div className={`${styles.panelCard} sketch-box`}>
            <div className={styles.panelTitle}>{tx.scenarioBox}</div>
            <div className={styles.scenarioCardContent}>
              <div className={styles.scenarioIconBox}>{situationIcon}</div>
              <div className={styles.scenarioTopicText}>{topic}</div>
            </div>
          </div>

          {/* Panel 2: HỖ TRỢ (Cài đặt hiển thị) */}
          <div className={`${styles.panelCard} sketch-box`}>
            <div className={styles.panelTitle}>{tx.supportBox}</div>
            <div className={styles.toggleList}>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{tx.optPinyin}</span>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${showPinyin ? styles.toggleOn : ''}`}
                  onClick={() => setShowPinyin(v => !v)}
                  aria-label={tx.optPinyin}
                >
                  <span className={styles.toggleHandle} />
                </button>
              </div>

              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{tx.optSuggestions}</span>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${showSuggestions ? styles.toggleOn : ''}`}
                  onClick={() => setShowSuggestions(v => !v)}
                  aria-label={tx.optSuggestions}
                >
                  <span className={styles.toggleHandle} />
                </button>
              </div>

              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{tx.optTranslation}</span>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${showTranslation ? styles.toggleOn : ''}`}
                  onClick={() => setShowTranslation(v => !v)}
                  aria-label={tx.optTranslation}
                >
                  <span className={styles.toggleHandle} />
                </button>
              </div>

              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{tx.optCorrection}</span>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${showCorrection ? styles.toggleOn : ''}`}
                  onClick={() => setShowCorrection(v => !v)}
                  aria-label={tx.optCorrection}
                >
                  <span className={styles.toggleHandle} />
                </button>
              </div>
            </div>
          </div>

          {/* Panel 3: TỪ VỰNG TRONG BÀI */}
          <div className={`${styles.panelCard} sketch-box`}>
            <div className={styles.panelTitle}>{tx.vocabBox}</div>
            {allVocabs.length === 0 ? (
              <div className={styles.emptyVocabRow}>
                <span style={{ fontSize: 26 }}>🤔</span>
                <span className={styles.emptyVocabText}>{tx.noVocab}</span>
              </div>
            ) : (
              <div className={styles.vocabItemList}>
                {allVocabs.map((vocab, vIdx) => (
                  <div key={vIdx} className={styles.vocabItemCard}>
                    <div className={styles.vocabWordLine}>
                      <span className={styles.vocabWord}>{vocab.word}</span>
                      <button
                        className={styles.vocabAudioBtn}
                        onClick={() => playAudio(vocab.word)}
                        title="Phát âm từ"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                    {vocab.pinyin && <div className={styles.vocabPinyin}>{vocab.pinyin}</div>}
                    <div className={styles.vocabMeaning}>{vocab.meaning}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    );
  }

  // ======================= SETUP SCREEN =======================
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.hero} sketch-cross`}>
        <div className={styles.heroTitleRow}>
          <span className={styles.heroIcon}>🎭</span>
          <h1 className={styles.heroTitle}>{tx.title}</h1>
          <span className={`${styles.newBadge} sketch-cross`}>NEW</span>
        </div>
        <p className={styles.heroSubtitle}>{tx.subtitle}</p>
      </div>

      <div className={`${styles.formCard} sketch-cross`}>
        <div className={styles.quickLabel}>{tx.quickLabel}</div>
        <div className={styles.quickList}>
          {tx.quick.map(q => (
            <button
              key={q.topic}
              className={`${styles.quickChip} ${topic === q.topic ? styles.quickChipActive : ''}`}
              onClick={() => {
                setTopic(q.topic);
                setPartner(q.partner);
              }}
            >
              <span>{q.icon}</span>
              <span>{q.topic}</span>
            </button>
          ))}
        </div>

        <label className={styles.fieldLabel} htmlFor="roleplay-topic">
          {tx.topicLabel} <span className={styles.required}>*</span>
        </label>
        <input
          id="roleplay-topic"
          className={styles.textInput}
          placeholder={tx.topicPh}
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />

        <label className={styles.fieldLabel} htmlFor="roleplay-partner">
          {tx.partnerLabel} <span className={styles.required}>*</span>
        </label>
        <input
          id="roleplay-partner"
          className={styles.textInput}
          placeholder={tx.partnerPh}
          value={partner}
          onChange={e => setPartner(e.target.value)}
        />

        <div className={styles.fieldLabel}>{tx.levelLabel}</div>
        <div className={styles.levelRow}>
          {LEVELS.map(l => (
            <button
              key={l.id}
              id={`roleplay-level-${l.id}`}
              className={`${styles.levelBtn} ${level === l.id ? styles.levelBtnActive : ''}`}
              onClick={() => setLevel(l.id)}
            >
              <span className={`${styles.levelTag} ${styles[l.cls]}`}>{l.tag}</span>
              <span>{tx[l.id]}</span>
            </button>
          ))}
        </div>

        <button
          id="roleplay-start"
          className={`${styles.startBtn} ${canStart ? styles.startBtnActive : ''}`}
          disabled={!canStart}
          onClick={handleStart}
        >
          <MessageCircle size={18} />
          <span>{tx.start}</span>
        </button>

        <div className={styles.footnote}>
          <Sparkles size={14} />
          <span>{tx.footnote}</span>
        </div>
      </div>
    </div>
  );
};
