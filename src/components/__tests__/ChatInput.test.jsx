import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock SpeechRecognition before importing ChatInput
const mockSpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  onresult: null,
  onend: null,
  onerror: null,
};
global.SpeechRecognition = class {
  constructor() {
    return mockSpeechRecognition;
  }
};

import ChatInput from '../ChatInput';

describe('ChatInput', () => {
  const defaultProps = {
    input: '',
    setInput: vi.fn(),
    handleSend: vi.fn(),
    isLoading: false,
    language: 'en',
    inputRef: { current: null },
  };

  it('renders textarea and send button', () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByLabelText('Type your message to Stadium IQ')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('calls setInput on type', async () => {
    const setInput = vi.fn();
    render(<ChatInput {...defaultProps} setInput={setInput} />);
    const textarea = screen.getByLabelText('Type your message to Stadium IQ');
    await userEvent.type(textarea, 'h');
    expect(setInput).toHaveBeenCalled();
  });

  it('calls handleSend on Enter', () => {
    const handleSend = vi.fn();
    const setInput = vi.fn();
    render(
      <ChatInput {...defaultProps} setInput={setInput} handleSend={handleSend} input="hello" />,
    );
    const textarea = screen.getByLabelText('Type your message to Stadium IQ');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(handleSend).toHaveBeenCalled();
  });

  it('does not send on Shift+Enter', () => {
    const handleSend = vi.fn();
    render(<ChatInput {...defaultProps} handleSend={handleSend} input="hello" />);
    const textarea = screen.getByLabelText('Type your message to Stadium IQ');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(handleSend).not.toHaveBeenCalled();
  });

  it('disables send button when input is empty', () => {
    render(<ChatInput {...defaultProps} input="" />);
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('disables send button when loading', () => {
    render(<ChatInput {...defaultProps} input="hello" isLoading={true} />);
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    render(<ChatInput {...defaultProps} input="hello" />);
    expect(screen.getByLabelText('Send message')).not.toBeDisabled();
  });

  describe('Voice Input', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('toggles voice recognition on and off', () => {
      render(<ChatInput {...defaultProps} />);
      const micBtn = screen.getByLabelText(/voice/i);

      // Start listening
      fireEvent.click(micBtn);
      expect(mockSpeechRecognition.start).toHaveBeenCalled();

      // Stop listening
      fireEvent.click(micBtn);
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('updates input when speech result is received', () => {
      const setInput = vi.fn();
      render(<ChatInput {...defaultProps} setInput={setInput} input="Hello" />);
      const micBtn = screen.getByLabelText(/voice/i);

      fireEvent.click(micBtn);

      // Simulate speech result
      const onresult = mockSpeechRecognition.onresult;
      if (onresult) {
        onresult({
          results: [[{ transcript: 'world' }]],
        });
      }

      // Check if setInput was called (prev state function is passed)
      expect(setInput).toHaveBeenCalled();

      // Simulate onend to stop listening
      if (mockSpeechRecognition.onend) mockSpeechRecognition.onend();
    });

    it('handles speech error gracefully', () => {
      render(<ChatInput {...defaultProps} />);
      const micBtn = screen.getByLabelText(/voice/i);

      fireEvent.click(micBtn);

      // Simulate error
      if (mockSpeechRecognition.onerror) mockSpeechRecognition.onerror();
    });
  });
});
