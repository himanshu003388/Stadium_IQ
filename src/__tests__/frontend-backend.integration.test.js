import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateChatInput } from '../../server/utils/validation.js';
import { buildSafeContext } from '../utils/contextFilter';

describe('Frontend-Backend Integration', () => {
  describe('Context flow from UI to server', () => {
    it('buildSafeContext output is valid input for validator', () => {
      const rawCtx = {
        stadium: {
          name: 'AT&T Stadium',
          capacity: 105000,
          currentOccupancy: 89000,
          homeTeam: 'Brazil',
          awayTeam: 'France',
          score: '2 - 1',
          matchPhase: "67'",
          weather: { temperature: 32, conditions: 'Clear', humidity: 45 },
        },
        gates: [
          {
            id: 'A',
            direction: 'North',
            density: 0.4,
            waitTimeMinutes: 5,
            status: 'normal',
            accessible: true,
            accessibleFeatures: ['wheelchair_ramp'],
          },
        ],
        incidents: [
          {
            id: 'I1',
            type: 'medical',
            severity: 'critical',
            status: 'active',
            location: 'North Stand',
          },
        ],
      };
      const safeCtx = buildSafeContext(rawCtx);
      const validationResult = validateChatInput({
        message: 'Where is the nearest gate?',
        language: 'en',
        contextData: safeCtx,
      });
      expect(validationResult).toHaveLength(0);
    });
  });

  describe('Sanitization pipeline', () => {
    it('sanitizeInput handles XSS attempts that pass client-side', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        "'; DROP TABLE users; --",
        '<svg onload=alert(1)>',
      ];
      for (const payload of xssPayloads) {
        const sanitized = sanitizeInput(payload);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
      }
    });

    it('sanitizeInput preserves legitimate text', () => {
      const text = 'What is the best gate to use?';
      expect(sanitizeInput(text)).toBe(text);
    });

    it('sanitizeInput handles mixed content', () => {
      const result = sanitizeInput('<b>Hello</b> <script>bad</script> World');
      expect(result).toBe('Hello  World');
    });
  });

  describe('buildSafeContext integration with chat input', () => {
    it('strips sensitive fields before sending to AI', () => {
      const raw = {
        stadium: { name: 'Test', internalAdminNotes: 'secret', securityCode: '1234' },
        gates: [{ id: 'A', staffPassword: 'hidden' }],
        incidents: [],
      };
      const safe = buildSafeContext(raw);
      expect(safe.stadium.internalAdminNotes).toBeUndefined();
      expect(safe.stadium.securityCode).toBeUndefined();
      expect(safe.gates[0].staffPassword).toBeUndefined();
    });

    it('limits incidents to active only, max 10', () => {
      const raw = {
        stadium: {},
        gates: [],
        incidents: Array.from({ length: 15 }, (_, i) => ({
          id: `I${i}`,
          status: i < 12 ? 'active' : 'resolved',
        })),
      };
      const safe = buildSafeContext(raw);
      expect(safe.incidents.length).toBeLessThanOrEqual(10);
      expect(safe.incidents.every((i) => i.status === undefined)).toBe(true);
    });
  });
});
