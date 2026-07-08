import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessage from '../ChatMessage';

describe('ChatMessage', () => {
  const createMsg = (overrides = {}) => ({
    id: 'msg1',
    role: 'user',
    text: 'Hello',
    timestamp: new Date(),
    ...overrides,
  });

  it('renders user message', () => {
    render(<ChatMessage msg={createMsg()} index={0} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders AI message with markdown styling', () => {
    const msg = createMsg({ role: 'ai', text: '**bold** response' });
    render(<ChatMessage msg={msg} index={0} />);
    expect(screen.getByText('bold', { exact: false })).toBeInTheDocument();
  });

  it('shows timestamp', () => {
    const msg = createMsg({ text: 'Test', timestamp: new Date('2026-07-08T12:00:00') });
    render(<ChatMessage msg={msg} index={0} />);
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
  });

  it('renders AI icon for AI messages', () => {
    render(<ChatMessage msg={createMsg({ role: 'ai' })} index={0} />);
    expect(screen.getByText('smart_toy')).toBeInTheDocument();
  });

  it('renders user icon for user messages', () => {
    render(<ChatMessage msg={createMsg({ role: 'user' })} index={0} />);
    expect(screen.getByText('person')).toBeInTheDocument();
  });
});
