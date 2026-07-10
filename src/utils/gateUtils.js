/**
 * Gate Utilities — maps gate statuses, colors, and coordinates.
 * Centralizes duplicate mapping logic from StadiumSVG, GatePanel, and AccessibilityHub.
 *
 * @module gateUtils
 */
import { COLORS, GATE_STATUS_COLORS } from './styles';

/**
 * SVG positions and orientation directions for gates in the stadium layout.
 * @type {Object.<string, {x: number, y: number, dir: string}>}
 */
export const GATE_POSITIONS = {
  A: { x: 250, y: 22, dir: 'N' },
  B: { x: 310, y: 22, dir: 'N' },
  C: { x: 250, y: 378, dir: 'S' },
  D: { x: 310, y: 378, dir: 'S' },
  E: { x: 412, y: 200, dir: 'E' },
  F: { x: 88, y: 200, dir: 'W' },
};

/**
 * Returns the CSS variable status color based on gate status.
 *
 * @param {string} status - Gate status ('critical', 'watch', or nominal).
 * @returns {string} The CSS variable color value.
 */
export function getGateStatusColor(status) {
  if (status === 'critical') return 'var(--color-status-critical)';
  if (status === 'watch') return 'var(--color-status-busy)';
  return 'var(--color-status-nominal)';
}

/**
 * Returns the theme variable color (e.g. COLORS.error, COLORS.warning) based on gate status.
 *
 * @param {string} status - Gate status.
 * @returns {string} The theme color variable.
 */
export function getGateThemeColor(status) {
  if (status === 'critical') return COLORS.error;
  if (status === 'watch') return COLORS.warning;
  return COLORS.success;
}

/**
 * Returns the gate status color configuration (bg, text, label) from theme styles.
 *
 * @param {string} status - Gate status.
 * @returns {{bg: string, text: string, label: string}} The color config object.
 */
export function getGateColorConfig(status) {
  return GATE_STATUS_COLORS[status] || GATE_STATUS_COLORS.normal;
}
