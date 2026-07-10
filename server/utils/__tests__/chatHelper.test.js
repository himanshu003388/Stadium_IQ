import { describe, it, expect } from 'vitest';
import { doPurify, getStableContextDigest, sanitizeOutput } from '../chatHelper.js';

describe('chatHelper.js', () => {
  describe('doPurify', () => {
    it('strips basic HTML tags and scripts', () => {
      expect(doPurify('<script>alert(1)</script><b>hello</b>')).toBe('hello');
    });

    it('removes special angle brackets and quotes', () => {
      expect(doPurify('< > " \' `')).toBe('');
    });
  });

  describe('getStableContextDigest', () => {
    it('returns empty string for null context', () => {
      expect(getStableContextDigest(null)).toBe('');
    });

    it('returns a stable hash that ignores occupancy changes within same 5% bucket', () => {
      const ctx1 = {
        stadium: { capacity: 100000, currentOccupancy: 81000, score: '1-0', matchPhase: "75'" },
        gates: [{ id: 'A', status: 'normal', accessible: true }],
      };
      const ctx2 = {
        stadium: { capacity: 100000, currentOccupancy: 82000, score: '1-0', matchPhase: "75'" },
        gates: [{ id: 'A', status: 'normal', accessible: true }],
      };
      const d1 = getStableContextDigest(ctx1);
      const d2 = getStableContextDigest(ctx2);
      expect(d1).toBe(d2);
      expect(d1).toHaveLength(64); // sha256 hex length
    });
  });

  describe('sanitizeOutput', () => {
    it('removes html tags and scripts from AI output', () => {
      expect(sanitizeOutput('<script>alert(1)</script>Clean Text')).toBe('Clean Text');
    });
  });
});
