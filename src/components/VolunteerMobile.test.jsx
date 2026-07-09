import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VolunteerMobile from './VolunteerMobile';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

expect.extend(toHaveNoViolations);

const mockResolveTask = vi.fn();

vi.mock('../context/StadiumContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useStadiumContext: (selector) => {
      const state = {
        resolveTask: mockResolveTask,
        contextData: {
          volunteers: [{ id: 'V1', name: 'Elena Vargas', zone: 'North', avatar: 'EV' }],
          tasks: [
            {
              id: 'T1',
              assignedTo: 'V1',
              status: 'in-progress',
              description: 'Help fan at Gate A',
              zone: 'North',
              requiredLanguage: 'es',
              priority: 'high',
            },
          ],
          stadium: {
            currentOccupancy: 68,
          },
        },
      };
      return selector ? selector(state) : state;
    },
  };
});

beforeEach(() => {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
});

describe('VolunteerMobile', () => {
  beforeEach(() => {
    mockResolveTask.mockClear();
  });

  it('renders without crashing and displays volunteer name', () => {
    render(<VolunteerMobile />);
    expect(screen.getByText('Elena Vargas')).toBeInTheDocument();
  });

  it('displays the active task assigned to the volunteer', () => {
    render(<VolunteerMobile />);
    expect(screen.getByText('Help fan at Gate A')).toBeInTheDocument();
    expect(screen.getByText('T1')).toBeInTheDocument();
  });

  it('displays AI Navigation and translated phrase', () => {
    render(<VolunteerMobile />);
    expect(screen.getByText('AI Navigation & Translation')).toBeInTheDocument();
    expect(screen.getByText(/Hola, estoy aquí para ayudarle/i)).toBeInTheDocument();
  });

  it('calls resolveTask when "Mark as Complete" is clicked', () => {
    render(<VolunteerMobile />);
    const btn = screen.getByText('Mark as Complete');
    fireEvent.click(btn);
    expect(mockResolveTask).toHaveBeenCalledWith('T1');
  });

  it('translates a custom phrase when entered', async () => {
    vi.useFakeTimers();
    render(<VolunteerMobile />);
    const input = screen.getByLabelText('Phrase to translate');
    const translateBtn = screen.getByLabelText('Translate phrase');

    // Button should be disabled initially
    expect(translateBtn).toBeDisabled();

    // Type a phrase
    fireEvent.change(input, { target: { value: 'Where is the restroom?' } });
    expect(translateBtn).not.toBeDisabled();

    // Click translate
    fireEvent.click(translateBtn);

    // Should show loading state
    expect(translateBtn).toHaveTextContent('...');

    // Fast forward timer
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // Should display the translated phrase
    expect(screen.getByText(/Translated to ES/i)).toBeInTheDocument();

    // Input should clear
    expect(input.value).toBe('');
    vi.useRealTimers();
  });

  it('translates on Enter key press', async () => {
    vi.useFakeTimers();
    render(<VolunteerMobile />);
    const input = screen.getByLabelText('Phrase to translate');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/Translated to ES/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<VolunteerMobile />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
