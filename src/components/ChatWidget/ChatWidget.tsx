'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import styles from './ChatWidget.module.css';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: 'Chào bạn! Mình là trợ lý Nhai TOCFL. Bạn đang muốn bắt đầu học cấp độ nào?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const quickTopics = [
    'Lộ trình TOCFL 1',
    'TOCFL 3.0 khác gì 2.0?',
    'Mẹo nhớ chữ Hán',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInputValue('');

    // Quick bot answer
    setTimeout(() => {
      let reply = 'Cảm ơn câu hỏi của bạn! Hãy nhấp vào một trong các thẻ TOCFL trên màn hình để bắt đầu học ngay nhé!';
      if (text.includes('TOCFL 1') || text.includes('Lộ trình')) {
        reply = 'TOCFL 1 bản mới gồm 333 từ vựng và 41 mẫu câu căn bản, bạn nên học phát âm pinyin chuẩn trước tiên nhé!';
      } else if (text.includes('3.0')) {
        reply = 'TOCFL 3.0 chia thành 3 giai đoạn và 9 cấp độ (thay vì 6 cấp như trước), bổ sung thêm nhiều từ vựng và kỹ năng giao tiếp thực tế hơn!';
      }
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  return (
    <div className={styles.widgetWrapper}>
      {/* Chat Dialogue Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderTitle}>
              <span>🤖 Trợ lý Nhai TOCFL</span>
            </div>
            <button
              type="button"
              className={styles.closeChatBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Đóng khung chat"
            >
              <X size={15} />
            </button>
          </div>

          <div className={styles.messagesList}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={msg.sender === 'bot' ? styles.botMsg : styles.userMsg}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Quick chips */}
          <div className={styles.quickChips}>
            {quickTopics.map((topic, i) => (
              <button
                key={i}
                type="button"
                className={styles.chipBtn}
                onClick={() => handleSendMessage(topic)}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            className={styles.inputArea}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Nhập câu hỏi..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className={styles.sendBtn} aria-label="Gửi tin nhắn">
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        className={styles.chatTriggerBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Nhắn tin hỗ trợ"
      >
        <MessageSquare size={17} />
        <span className={styles.btnText}>Nhắn tin</span>
      </button>
    </div>
  );
};
