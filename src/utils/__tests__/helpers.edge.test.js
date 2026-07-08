import { describe, it, expect } from 'vitest';
import {
  timeAgo,
  getDemoResponse,
  renderMarkdown,
  getLoadBarColor,
  getDensityColor,
} from '../helpers';

describe('helpers edge cases', () => {
  describe('timeAgo', () => {
    it('returns "just now" for timestamps within 1 minute', () => {
      expect(timeAgo(new Date().toISOString())).toBe('just now');
    });

    it('returns minutes for timestamps within 1 hour', () => {
      const past = new Date(Date.now() - 5 * 60000).toISOString();
      expect(timeAgo(past)).toBe('5m ago');
    });

    it('returns hours for timestamps within 24 hours', () => {
      const past = new Date(Date.now() - 3 * 3600000).toISOString();
      expect(timeAgo(past)).toBe('3h ago');
    });

    it('returns days for timestamps older than 24 hours', () => {
      const past = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(timeAgo(past)).toBe('2d ago');
    });
  });

  describe('getDemoResponse', () => {
    const mockCtx = {
      gates: [{ id: 'A', density: 0.3, waitTimeMinutes: 5, accessible: true, direction: 'North' }],
      transportOptions: [
        {
          id: 'TR1',
          type: 'Subway',
          line: 'Red Line',
          etaMinutes: 10,
          co2e: 5,
          capacityLeft: 200,
          recommended: true,
        },
      ],
      stadium: {
        name: 'Test',
        capacity: 100000,
        currentOccupancy: 50000,
        weather: { temperature: 25, feelsLike: 27, conditions: 'clear', humidity: 50 },
        sustainability: { co2SavedKg: 1000, renewablePercentage: 80, wasteDiversionRate: 60 },
      },
      accessibilityServices: [
        { type: 'Wheelchair', locations: ['Gate A'], description: 'Available' },
      ],
    };

    it('returns default response for unknown query', () => {
      const res = getDemoResponse('random text', mockCtx);
      expect(res).toContain('Test');
    });

    it('returns gate response for gate query', () => {
      const res = getDemoResponse('which gate to enter?', mockCtx);
      expect(res).toContain('Gate');
    });

    it('returns transport response', () => {
      const res = getDemoResponse('best transport option', mockCtx);
      expect(res).toContain('Subway');
    });

    it('returns weather response', () => {
      const res = getDemoResponse('temperature outside', mockCtx);
      expect(res).toContain('25');
    });

    it('returns crowd response', () => {
      const res = getDemoResponse('how busy is it?', mockCtx);
      expect(res).toContain('capacity');
    });

    it('returns eco response', () => {
      const res = getDemoResponse('carbon footprint?', mockCtx);
      expect(res).toContain('CO₂');
    });

    it('returns accessibility response', () => {
      const res = getDemoResponse('wheelchair accessible?', mockCtx);
      expect(res).toContain('Accessibility');
    });

    it('returns food response', () => {
      const res = getDemoResponse('food nearby', mockCtx);
      expect(res).toContain('Food');
    });

    it('returns parking response', () => {
      const res = getDemoResponse('parking lot', mockCtx);
      expect(res).toContain('Parking');
    });

    it('returns merch response', () => {
      const res = getDemoResponse('merchandise store', mockCtx);
      expect(res).toContain('Merchandise');
    });

    it('returns Spanish response', () => {
      const res = getDemoResponse('hola', mockCtx, 'es');
      expect(res).toContain('Bienvenido');
    });
  });

  describe('renderMarkdown', () => {
    it('renders bold text', () => {
      expect(renderMarkdown('**hello**')).toContain('<strong>hello</strong>');
    });

    it('renders bullet points', () => {
      const result = renderMarkdown('• item 1\n• item 2');
      expect(result).toContain('<ul');
      expect(result).toContain('<li>item 1</li>');
    });

    it('handles line breaks', () => {
      const result = renderMarkdown('line1\nline2');
      expect(result).toContain('<br/>');
    });
  });

  describe('getLoadBarColor', () => {
    it('returns critical for full load', () => {
      expect(getLoadBarColor(5, 5)).toBe('var(--color-status-critical)');
    });

    it('returns busy for high load', () => {
      expect(getLoadBarColor(3, 5)).toBe('var(--color-status-busy)');
    });

    it('returns nominal for low load', () => {
      expect(getLoadBarColor(1, 5)).toBe('var(--color-status-nominal)');
    });
  });

  describe('getDensityColor', () => {
    it('returns critical for high density', () => {
      expect(getDensityColor(0.9)).toBe('var(--color-status-critical)');
    });

    it('returns busy for medium density', () => {
      expect(getDensityColor(0.7)).toBe('var(--color-status-busy)');
    });

    it('returns nominal for low density', () => {
      expect(getDensityColor(0.5)).toBe('var(--color-status-nominal)');
    });
  });
});
