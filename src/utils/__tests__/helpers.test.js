import { describe, it, expect } from 'vitest';
import {
  timeAgo,
  getLoadBarColor,
  getDensityColor,
  getStatusColor,
  getCO2Color,
  getSeverityColor,
  getCapacityColor,
} from '../helpers';
import { buildSafeContext } from '../contextFilter';

describe('timeAgo', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe('2d ago');
  });
});

describe('getLoadBarColor', () => {
  it('returns critical color at 100% load', () => {
    expect(getLoadBarColor(5, 5)).toBe('var(--color-status-critical)');
  });

  it('returns busy color at 60%+ load', () => {
    expect(getLoadBarColor(3, 5)).toBe('var(--color-status-busy)');
  });

  it('returns nominal color below 60%', () => {
    expect(getLoadBarColor(2, 5)).toBe('var(--color-status-nominal)');
  });
});

describe('getDensityColor', () => {
  it('returns critical for density > 0.85', () => {
    expect(getDensityColor(0.9)).toBe('var(--color-status-critical)');
  });

  it('returns busy for density > 0.65', () => {
    expect(getDensityColor(0.7)).toBe('var(--color-status-busy)');
  });

  it('returns nominal for low density', () => {
    expect(getDensityColor(0.3)).toBe('var(--color-status-nominal)');
  });
});

describe('getStatusColor', () => {
  it('returns critical for "critical" status', () => {
    expect(getStatusColor('critical')).toBe('var(--color-status-critical)');
  });

  it('returns busy for "watch" status', () => {
    expect(getStatusColor('watch')).toBe('var(--color-status-busy)');
  });

  it('returns nominal for normal status', () => {
    expect(getStatusColor('normal')).toBe('var(--color-status-nominal)');
  });
});

describe('getCO2Color', () => {
  it('returns success for zero emissions', () => {
    expect(getCO2Color(0)).toBe('var(--color-success)');
  });

  it('returns tertiary for low emissions', () => {
    expect(getCO2Color(5)).toBe('var(--color-tertiary)');
  });

  it('returns error for high emissions', () => {
    expect(getCO2Color(50)).toBe('var(--color-error)');
  });
});

describe('getSeverityColor', () => {
  it('returns error for critical severity', () => {
    expect(getSeverityColor('critical')).toBe('var(--color-error)');
  });

  it('returns warning for medium severity', () => {
    expect(getSeverityColor('medium')).toBe('var(--color-warning)');
  });

  it('returns info for low severity', () => {
    expect(getSeverityColor('low')).toBe('var(--color-info)');
  });
});

describe('getCapacityColor', () => {
  it('returns error for 5 or fewer seats', () => {
    expect(getCapacityColor(3)).toBe('var(--color-error)');
  });

  it('returns warning for 6-20 seats', () => {
    expect(getCapacityColor(15)).toBe('var(--color-warning)');
  });

  it('returns success for more than 20 seats', () => {
    expect(getCapacityColor(50)).toBe('var(--color-success)');
  });
});

describe('buildSafeContext', () => {
  it('returns empty object for null input', () => {
    expect(buildSafeContext(null)).toEqual({});
  });

  it('strips non-whitelisted fields', () => {
    const ctx = buildSafeContext({
      stadium: { name: 'Test', secretData: 'hidden' },
      gates: [],
    });
    expect(ctx.stadium.name).toBe('Test');
    expect(ctx.stadium.secretData).toBeUndefined();
  });

  it('handles missing gates gracefully', () => {
    expect(buildSafeContext({ stadium: {} }).gates).toEqual([]);
  });

  it('only includes active incidents (max 10)', () => {
    const ctx = buildSafeContext({
      stadium: { name: 'Test' },
      incidents: [
        { id: '1', status: 'active', type: 'crowd', severity: 'critical', location: 'North' },
        { id: '2', status: 'resolved', type: 'crowd', severity: 'low', location: 'South' },
      ],
    });
    expect(ctx.incidents).toHaveLength(1);
    expect(ctx.incidents[0].id).toBe('1');
  });
});
