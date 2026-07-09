import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import AccessibilityHub from './AccessibilityHub';
import { StadiumProvider } from '../context/StadiumContext';

describe('AccessibilityHub', () => {
  const renderWithContext = () => {
    return render(
      <StadiumProvider>
        <AccessibilityHub />
      </StadiumProvider>,
    );
  };

  it('renders the accessibility hub heading', () => {
    renderWithContext();
    expect(screen.getByText('Accessibility Hub')).toBeInTheDocument();
  });

  it('renders accessible gates', () => {
    renderWithContext();
    expect(screen.getByRole('heading', { name: /Accessible Gates/i })).toBeInTheDocument();
  });

  it('renders available services', () => {
    renderWithContext();
    expect(screen.getByText('Available Services')).toBeInTheDocument();
  });

  it('handles quick queries and shows AI tip', () => {
    renderWithContext();
    const btn = screen.getByText('Wheelchair routes');
    fireEvent.click(btn);
    // When the tip appears, the Ask something else button is rendered
    expect(screen.getByText('Ask something else')).toBeInTheDocument();

    const askSomethingElseBtn = screen.getByText('Ask something else');
    fireEvent.click(askSomethingElseBtn);
    expect(screen.queryByText(/AI Suggestion for/i)).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithContext();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('toggles global accessibility modes', () => {
    renderWithContext();
    const hcToggle = screen.getByLabelText('Toggle High Contrast Mode');
    const dmxToggle = screen.getByLabelText('Toggle Dyslexia-Friendly Font');

    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
    expect(document.documentElement.classList.contains('dyslexia-mode')).toBe(false);

    fireEvent.click(hcToggle);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);

    fireEvent.click(dmxToggle);
    expect(document.documentElement.classList.contains('dyslexia-mode')).toBe(true);

    fireEvent.click(hcToggle);
    fireEvent.click(dmxToggle);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
    expect(document.documentElement.classList.contains('dyslexia-mode')).toBe(false);
  });
});
