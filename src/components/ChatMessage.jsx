import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../utils/styles';
import MarkdownRenderer from './MarkdownRenderer';

const ChatMessage = memo(function ChatMessage({ msg, index }) {
  return (
    <div
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 items-end animate-fade-in-up`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {msg.role === 'ai' && (
        <div
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mb-0.5"
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
      )}
      <div
        className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
        aria-hidden={msg.isStreaming ? 'true' : undefined}
      >
        {msg.role === 'ai' ? (
          <div className="text-sm">
            <MarkdownRenderer text={msg.text} />
          </div>
        ) : (
          <p className="text-sm">{msg.text}</p>
        )}
        <div
          className="text-xs mt-1.5"
          style={{ opacity: 0.65, color: 'var(--color-on-surface-variant)' }}
        >
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {msg.role === 'user' && (
        <div
          className="w-7 h-7 rounded-full shrink-0 mb-0.5 flex items-center justify-center"
          style={{ background: COLORS.surfaceContainerHigh }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-sm"
            style={{ color: COLORS.onSurfaceVariant }}
          >
            person
          </span>
        </div>
      )}
    </div>
  );
});

ChatMessage.propTypes = {
  msg: PropTypes.shape({
    role: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date).isRequired,
    id: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export default ChatMessage;
