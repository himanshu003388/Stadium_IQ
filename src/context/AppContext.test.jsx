import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppProvider, useAppContext } from './AppContext';
import React from 'react';

const TestComponent = () => {
  const { theme, toggleTheme, activeView, setActiveView } = useAppContext();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="activeView">{activeView}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setActiveView('assistant')}>Set View Assistant</button>
    </div>
  );
};

describe('AppContext', () => {
  it('throws error when used outside provider', () => {
    const originalError = console.error; // eslint-disable-line no-console
    console.error = () => {}; // eslint-disable-line no-console
    expect(() => render(<TestComponent />)).toThrow(
      'useAppContext must be used within an AppProvider',
    );
    console.error = originalError; // eslint-disable-line no-console
  });

  it('provides theme and allows toggling', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    fireEvent.click(screen.getByText('Toggle Theme'));
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(screen.getByText('Toggle Theme'));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('allows setting active view and triggers re-render', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );
    expect(screen.getByTestId('activeView')).toHaveTextContent('dashboard');
    fireEvent.click(screen.getByText('Set View Assistant'));
    expect(screen.getByTestId('activeView')).toHaveTextContent('assistant');
  });

  it('provides default activeView of dashboard', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );
    expect(screen.getByTestId('activeView')).toHaveTextContent('dashboard');
  });
});
