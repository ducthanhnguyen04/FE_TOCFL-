'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import styles from './ChatWidget.module.css';

export const ChatWidget: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([]);
  const [inputValue, setInputValue] = useState('');

  // Update greeting when language changes or on mount
  useEffect(() => {
    setMessages([{ sender: 'bot', text: t('chat.botGreeting') }]);
  }, [t]);

  const quickTopics = [
    t('chat.quick1'),
    t('chat.quick2'),
    t('chat.quick3'),
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInputValue('');

    // Quick bot answer
    setTimeout(() => {
      let reply = t('chat.replyDefault');
      if (text.includes('TOCFL 1') || text.includes('Lộ trình') || text.includes('Route') || text.includes('Rute')) {
        reply = t('chat.replyRoute');
      } else if (text.includes('3.0')) {
        reply = t('chat.replyTOCFL3');
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
              <span>{t('chat.botTitle')}</span>
            </div>
            <button
              type="button"
              className={styles.closeChatBtn}
              onClick={() => setIsOpen(false)}
              aria-label={t('chat.closeAria')}
            >
              <X size={15} />
            </button>
          </div>

          <div className={styles.messagesList}>
            {messages.map((msg, index) => (
              <div
                key={`${msg.sender}-${index}`}
                className={msg.sender === 'bot' ? styles.botMsg : styles.userMsg}
              >
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Quick chips */}
          <div className={styles.quickChips}>
            {quickTopics.map((topic, i) => (
              <button
                key={`topic-${i}`}
                type="button"
                className={styles.chipBtn}
                onClick={() => handleSendMessage(topic)}
              >
                <span>{topic}</span>
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
              placeholder={t('chat.inputPlaceholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className={styles.sendBtn} aria-label={t('chat.sendAria')}>
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
        aria-label={t('chat.triggerAria')}
      >
        <MessageSquare size={17} />
        <span className={styles.btnText}>{t('chat.message')}</span>
      </button>
    </div>
  );
};
