import { describe, it, expect } from 'vitest';
import {
  GATE_POSITIONS,
  getGateStatusColor,
  getGateThemeColor,
  getGateColorConfig,
} from '../gateUtils';
import { COLORS } from '../styles';

describe('gateUtils.js', () => {
  it('has position mapping for gates A to F', () => {
    expect(GATE_POSITIONS.A).toEqual({ x: 250, y: 22, dir: 'N' });
    expect(GATE_POSITIONS.F).toEqual({ x: 88, y: 200, dir: 'W' });
  });

  it('maps gate status to CSS variable color strings', () => {
    expect(getGateStatusColor('critical')).toBe('var(--color-status-critical)');
    expect(getGateStatusColor('watch')).toBe('var(--color-status-busy)');
    expect(getGateStatusColor('normal')).toBe('var(--color-status-nominal)');
  });

  it('maps gate status to theme COLORS variables', () => {
    expect(getGateThemeColor('critical')).toBe(COLORS.error);
    expect(getGateThemeColor('watch')).toBe(COLORS.warning);
    expect(getGateThemeColor('normal')).toBe(COLORS.success);
  });

  it('returns appropriate color configuration mapping', () => {
    expect(getGateColorConfig('critical').text).toBe('#7F1D1D');
    expect(getGateColorConfig('watch').bg).toBe('#FFEDD5');
    expect(getGateColorConfig('unknown').text).toBe('#14532D'); // fallback to normal
  });
});
