/**
 * AI Assistant Component
 * Provides a GenAI-enabled chat interface for tournament operations,
 * supporting multilingual assistance, context awareness, and streaming.
 *
 * @component
 */
import React, { useState, useRef, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { useAppContext } from '../context/AppContext';
import { useGemini } from '../hooks/useGemini';
import { useScrollToBottom } from '../hooks/useScrollToBottom';
import { COLORS, QUICK_PROMPTS } from '../utils/styles';
import LanguageSelector from './LanguageSelector';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

/**
 * GenAI Assistant panel supporting chat streaming, language select, and quick prompts.
 *
 * @returns {React.ReactElement} The AIAssistant component.
 */
function AIAssistant() {
  const contextData = useStadiumContext((s) => s.contextData);
  const { setUiLanguage, geminiActive } = useAppContext();
  const { messages, isLoading, language, setLanguage, sendMessage } = useGemini(contextData);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync AI language selection to global html lang attribute
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setUiLanguage(lang);
  };

  // Scroll to bottom when messages or loading state changes
  useScrollToBottom(messagesEndRef, [messages, isLoading]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] p-4 md:p-6 flex flex-col">
      <div
        className="flex-1 flex flex-col rounded-2xl md:rounded-3xl overflow-hidden shadow-lg"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.outlineVariant}`,
        }}
      >
        {/* Panel Header */}
        <div
          className="shrink-0 px-5 py-4 border-b flex items-center gap-3"
          style={{
            background: COLORS.surfaceContainerLowest,
            borderColor: COLORS.outlineVariant,
            boxShadow: '0 2px 8px rgba(11,30,61,0.04)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: COLORS.gradientNavy }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              smart_toy
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              FIFA World Cup 2026 GenAI Assistant
            </h2>
            <p
              className="text-xs flex items-center gap-1.5 truncate"
              style={{ color: COLORS.outline }}
            >
              {geminiActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Powered by Gemini AI · Multilingual support for all fans & staff
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  ⚠️ Offline Demo Mode · Using local contextual fallback engine
                </>
              )}
            </p>
          </div>
          <LanguageSelector language={language} setLanguage={handleLanguageChange} />
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar"
          style={{ background: COLORS.background }}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          aria-relevant="additions"
        >
          {messages.map((msg, i) => (
            <ChatMessage key={msg.id} msg={msg} index={i} />
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 animate-fade-in-up">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
                }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}
                >
                  smart_toy
                </span>
              </div>
              <div className="chat-bubble-ai">
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div
          className="shrink-0 px-4 py-2 overflow-x-auto flex gap-2"
          style={{ background: COLORS.background, borderTop: `1px solid ${COLORS.outlineVariant}` }}
        >
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.text}
              data-testid="quick-prompt-btn"
              onClick={() => sendMessage(q.text)}
              disabled={isLoading}
              aria-label={`Ask: ${q.text}`}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: COLORS.surfaceContainerLowest,
                border: `1.5px solid ${COLORS.outlineVariant}`,
                color: COLORS.onSurfaceVariant,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined"
                style={{ fontSize: '14px', color: COLORS.primaryContainer }}
              >
                {q.icon}
              </span>
              {q.text}
            </button>
          ))}
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isLoading={isLoading}
          language={language}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}

/**
 * AIAssistant reads all data via context hooks and accepts no direct props.
 */
AIAssistant.propTypes = {};
export default memo(AIAssistant);
