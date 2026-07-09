/**
 * Color Contrast Verification Tests
 * Ensures design token colors meet WCAG AA contrast ratios
 */
import { describe, it, expect } from 'vitest';

/**
 * Relative luminance calculation (WCAG formula)
 */
function relativeLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * WCAG contrast ratio between two hex colors
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Design token color palette from the style system
 */
const COLORS = {
  onSurface: '#0b1e3d',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onError: '#ffffff',
  onWarning: '#1a1a2e',
  onSuccess: '#ffffff',
  surface: '#fafcff',
  primary: '#1a5da8',
  background: '#eef2f6',
  outline: '#64748b',
  error: '#b91c1c',
  success: '#15803d',
  warning: '#b45309',
  info: '#2563eb',
  primaryContainer: '#3b82f6',
  secondary: '#7c3aed',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#f1f5f9',
  surfaceContainerHigh: '#e2e8f0',
  surfaceDim: '#cbd5e1',
  onSurfaceVariant: '#475569',
  onErrorContainer: '#991b1b',
  errorContainer: '#fecaca',
  infoContainer: '#dbeafe',
  warningContainer: '#fed7aa',
  warningFill: '#f59e0b',
};

const textSizes = {
  small: 14,
  normal: 16,
  large: 18,
};

function isLargeText(sizePx, bold) {
  if (bold && sizePx >= 14) return true;
  return sizePx >= 18;
}

describe('Color Contrast - WCAG AA Compliance', () => {
  const pairs = [
    // Normal text (requires 4.5:1)
    { fg: COLORS.onSurface, bg: COLORS.surface, label: 'onSurface on surface', size: 'normal' },
    {
      fg: COLORS.onSurface,
      bg: COLORS.background,
      label: 'onSurface on background',
      size: 'normal',
    },
    { fg: COLORS.primary, bg: COLORS.surface, label: 'primary on surface', size: 'normal' },
    { fg: COLORS.outline, bg: COLORS.surface, label: 'outline on surface', size: 'normal' },
    { fg: COLORS.error, bg: COLORS.surface, label: 'error on surface', size: 'normal' },
    {
      fg: COLORS.onSurfaceVariant,
      bg: COLORS.surface,
      label: 'onSurfaceVariant on surface',
      size: 'normal',
    },
    { fg: COLORS.onPrimary, bg: COLORS.primary, label: 'onPrimary on primary', size: 'normal' },
    { fg: COLORS.onError, bg: COLORS.error, label: 'onError on error', size: 'normal' },
    { fg: COLORS.onSuccess, bg: COLORS.success, label: 'onSuccess on success', size: 'normal' },
    // Large text (requires 3:1)
    {
      fg: COLORS.onSurface,
      bg: COLORS.surface,
      label: 'onSurface on surface (large)',
      size: 'large',
      bold: true,
    },
    {
      fg: COLORS.primaryContainer,
      bg: COLORS.surface,
      label: 'primaryContainer on surface',
      size: 'large',
    },
    {
      fg: COLORS.onWarning,
      bg: COLORS.warningContainer,
      label: 'onWarning on warningContainer',
      size: 'normal',
    },
  ];

  pairs.forEach(({ fg, bg, label, size, bold }) => {
    it(`"${label}" meets WCAG AA contrast ratio (${isLargeText(textSizes[size] || 16, bold) ? '3:1' : '4.5:1'})`, () => {
      const ratio = contrastRatio(fg, bg);
      const required = isLargeText(textSizes[size] || 16, bold) ? 3 : 4.5;
      expect(ratio).toBeGreaterThanOrEqual(required);
    });
  });
});
