import { describe, it, expect } from 'vitest';
import { queryCache } from '../cache.js';

describe('cache.js - queryCache', () => {
  it('should get and set cache values correctly', () => {
    queryCache.set('test_key', 'test_value');
    expect(queryCache.get('test_key')).toBe('test_value');
  });

  it('should return undefined for missing keys', () => {
    expect(queryCache.get('missing_key')).toBeUndefined();
  });
});
