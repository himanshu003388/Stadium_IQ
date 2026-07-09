/**
 * contextFilter.js — full branch & line coverage
 * Tests all five builder functions with valid, empty, and edge-case inputs.
 */
import { describe, it, expect } from 'vitest';
import {
  buildSafeContext,
  buildCrowdContext,
  buildTransportContext,
  buildSustainabilityContext,
  buildAccessibilityContext,
} from '../contextFilter';

// ─────────────────────────────────────────────
// Shared fixture
// ─────────────────────────────────────────────
const FULL_CTX = {
  stadium: {
    name: 'MetLife Stadium',
    capacity: 82500,
    currentOccupancy: 70000,
    homeTeam: 'USA',
    awayTeam: 'Mexico',
    score: '2-1',
    matchPhase: 'Second Half',
    weather: { temperature: 24, humidity: 55 },
    sustainability: { co2SavedKg: 1200, renewablePercentage: 85 },
  },
  gates: [
    {
      id: 'A',
      direction: 'North',
      density: 0.4,
      waitTimeMinutes: 5,
      status: 'normal',
      accessible: true,
      accessibleFeatures: ['wheelchair ramp', 'audio guide'],
    },
    {
      id: 'B',
      direction: 'South',
      density: 0.9,
      waitTimeMinutes: 20,
      status: 'critical',
      accessible: false,
      accessibleFeatures: null, // intentionally non-array
    },
  ],
  incidents: [
    { id: 'I1', type: 'crowd', severity: 'high', location: 'North', status: 'active' },
    { id: 'I2', type: 'medical', severity: 'low', location: 'South', status: 'resolved' },
    { id: 'I3', type: 'security', severity: 'medium', location: 'East', status: 'active' },
  ],
  transport: [{ type: 'subway', etaMinutes: 10 }],
  sustainability: { co2SavedKg: 900, renewablePercentage: 78, wasteDiversionRate: 65 },
};

// ─────────────────────────────────────────────
// buildSafeContext
// ─────────────────────────────────────────────
describe('buildSafeContext', () => {
  it('returns {} for null', () => {
    expect(buildSafeContext(null)).toEqual({});
  });

  it('returns {} for undefined', () => {
    expect(buildSafeContext(undefined)).toEqual({});
  });

  it('returns {} for a non-object primitive', () => {
    expect(buildSafeContext('string')).toEqual({});
    expect(buildSafeContext(42)).toEqual({});
    expect(buildSafeContext(true)).toEqual({});
  });

  it('maps all whitelisted stadium fields', () => {
    const ctx = buildSafeContext(FULL_CTX);
    expect(ctx.stadium.name).toBe('MetLife Stadium');
    expect(ctx.stadium.capacity).toBe(82500);
    expect(ctx.stadium.currentOccupancy).toBe(70000);
    expect(ctx.stadium.homeTeam).toBe('USA');
    expect(ctx.stadium.awayTeam).toBe('Mexico');
    expect(ctx.stadium.score).toBe('2-1');
    expect(ctx.stadium.matchPhase).toBe('Second Half');
    expect(ctx.stadium.weather).toEqual({ temperature: 24, humidity: 55 });
  });

  it('strips non-whitelisted stadium fields', () => {
    const ctx = buildSafeContext({ stadium: { name: 'X', secretData: 'hidden' } });
    expect(ctx.stadium.secretData).toBeUndefined();
  });

  it('maps gate fields correctly', () => {
    const ctx = buildSafeContext(FULL_CTX);
    expect(ctx.gates).toHaveLength(2);
    expect(ctx.gates[0]).toMatchObject({
      id: 'A',
      direction: 'North',
      density: 0.4,
      waitTimeMinutes: 5,
      status: 'normal',
      accessible: true,
      accessibleFeatures: ['wheelchair ramp', 'audio guide'],
    });
  });

  it('falls back to [] for gate.accessibleFeatures if not an array', () => {
    const ctx = buildSafeContext(FULL_CTX);
    expect(ctx.gates[1].accessibleFeatures).toEqual([]);
  });

  it('returns empty gates array when gates is not an array', () => {
    const ctx = buildSafeContext({ stadium: {}, gates: 'bad' });
    expect(ctx.gates).toEqual([]);
  });

  it('returns empty gates array when gates is missing', () => {
    const ctx = buildSafeContext({ stadium: {} });
    expect(ctx.gates).toEqual([]);
  });

  it('only keeps active incidents', () => {
    const ctx = buildSafeContext(FULL_CTX);
    expect(ctx.incidents.every((i) => !('status' in i))).toBe(true); // status stripped in output shape
    expect(ctx.incidents).toHaveLength(2); // I1 and I3 are active
  });

  it('limits incidents to 10', () => {
    const lotsOfIncidents = Array.from({ length: 15 }, (_, k) => ({
      id: `I${k}`,
      type: 'crowd',
      severity: 'low',
      location: 'East',
      status: 'active',
    }));
    const ctx = buildSafeContext({ stadium: {}, incidents: lotsOfIncidents });
    expect(ctx.incidents).toHaveLength(10);
  });

  it('returns empty incidents when incidents is not an array', () => {
    const ctx = buildSafeContext({ stadium: {}, incidents: 'bad' });
    expect(ctx.incidents).toEqual([]);
  });

  it('maps incident output shape correctly (id, type, severity, location)', () => {
    const ctx = buildSafeContext(FULL_CTX);
    const inc = ctx.incidents[0];
    expect(inc).toHaveProperty('id');
    expect(inc).toHaveProperty('type');
    expect(inc).toHaveProperty('severity');
    expect(inc).toHaveProperty('location');
  });

  it('handles empty stadium object gracefully', () => {
    const ctx = buildSafeContext({ stadium: {} });
    expect(ctx.stadium.name).toBeUndefined();
    expect(ctx.stadium.capacity).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// buildCrowdContext
// ─────────────────────────────────────────────
describe('buildCrowdContext', () => {
  it('returns {} for null', () => {
    expect(buildCrowdContext(null)).toEqual({});
  });

  it('returns {} for non-object', () => {
    expect(buildCrowdContext('bad')).toEqual({});
  });

  it('maps stadium crowd fields', () => {
    const ctx = buildCrowdContext(FULL_CTX);
    expect(ctx.stadium.name).toBe('MetLife Stadium');
    expect(ctx.stadium.currentOccupancy).toBe(70000);
    expect(ctx.stadium.capacity).toBe(82500);
    expect(ctx.stadium.matchPhase).toBe('Second Half');
  });

  it('does NOT include homeTeam, awayTeam, score, or weather', () => {
    const ctx = buildCrowdContext(FULL_CTX);
    expect(ctx.stadium.homeTeam).toBeUndefined();
    expect(ctx.stadium.awayTeam).toBeUndefined();
    expect(ctx.stadium.score).toBeUndefined();
    expect(ctx.stadium.weather).toBeUndefined();
  });

  it('maps gate fields (without accessibleFeatures)', () => {
    const ctx = buildCrowdContext(FULL_CTX);
    expect(ctx.gates).toHaveLength(2);
    expect(ctx.gates[0]).toMatchObject({
      id: 'A',
      direction: 'North',
      density: 0.4,
      waitTimeMinutes: 5,
      status: 'normal',
    });
    expect(ctx.gates[0].accessibleFeatures).toBeUndefined();
  });

  it('returns empty gates when gates not an array', () => {
    const ctx = buildCrowdContext({ stadium: {} });
    expect(ctx.gates).toEqual([]);
  });

  it('only keeps active incidents (max 5)', () => {
    const lotsOfIncidents = Array.from({ length: 10 }, (_, k) => ({
      id: `I${k}`,
      type: 'crowd',
      severity: 'low',
      location: 'North',
      status: 'active',
    }));
    const ctx = buildCrowdContext({ stadium: {}, incidents: lotsOfIncidents });
    expect(ctx.incidents).toHaveLength(5);
  });

  it('maps crowd incidents without id', () => {
    const ctx = buildCrowdContext(FULL_CTX);
    expect(ctx.incidents[0]).not.toHaveProperty('id');
    expect(ctx.incidents[0]).toHaveProperty('type');
    expect(ctx.incidents[0]).toHaveProperty('severity');
    expect(ctx.incidents[0]).toHaveProperty('location');
  });

  it('returns empty incidents when incidents not an array', () => {
    const ctx = buildCrowdContext({ stadium: {} });
    expect(ctx.incidents).toEqual([]);
  });
});

// ─────────────────────────────────────────────
// buildTransportContext
// ─────────────────────────────────────────────
describe('buildTransportContext', () => {
  it('returns {} for null', () => {
    expect(buildTransportContext(null)).toEqual({});
  });

  it('returns {} for non-object', () => {
    expect(buildTransportContext(123)).toEqual({});
  });

  it('maps stadium name, occupancy, capacity, matchPhase', () => {
    const ctx = buildTransportContext(FULL_CTX);
    expect(ctx.stadium.name).toBe('MetLife Stadium');
    expect(ctx.stadium.currentOccupancy).toBe(70000);
    expect(ctx.stadium.capacity).toBe(82500);
    expect(ctx.stadium.matchPhase).toBe('Second Half');
  });

  it('includes transport array from context', () => {
    const ctx = buildTransportContext(FULL_CTX);
    expect(ctx.transport).toEqual([{ type: 'subway', etaMinutes: 10 }]);
  });

  it('defaults transport to [] when missing', () => {
    const ctx = buildTransportContext({ stadium: {} });
    expect(ctx.transport).toEqual([]);
  });

  it('does NOT include gates or incidents', () => {
    const ctx = buildTransportContext(FULL_CTX);
    expect(ctx.gates).toBeUndefined();
    expect(ctx.incidents).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// buildSustainabilityContext
// ─────────────────────────────────────────────
describe('buildSustainabilityContext', () => {
  it('returns {} for null', () => {
    expect(buildSustainabilityContext(null)).toEqual({});
  });

  it('returns {} for non-object', () => {
    expect(buildSustainabilityContext(false)).toEqual({});
  });

  it('maps only stadium name and sustainability object', () => {
    const ctx = buildSustainabilityContext(FULL_CTX);
    expect(ctx.stadium.name).toBe('MetLife Stadium');
    expect(ctx.sustainability).toEqual({
      co2SavedKg: 900,
      renewablePercentage: 78,
      wasteDiversionRate: 65,
    });
  });

  it('defaults sustainability to {} when missing', () => {
    const ctx = buildSustainabilityContext({ stadium: { name: 'X' } });
    expect(ctx.sustainability).toEqual({});
  });

  it('does NOT include gates, incidents, or transport', () => {
    const ctx = buildSustainabilityContext(FULL_CTX);
    expect(ctx.gates).toBeUndefined();
    expect(ctx.incidents).toBeUndefined();
    expect(ctx.transport).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// buildAccessibilityContext
// ─────────────────────────────────────────────
describe('buildAccessibilityContext', () => {
  it('returns {} for null', () => {
    expect(buildAccessibilityContext(null)).toEqual({});
  });

  it('returns {} for non-object', () => {
    expect(buildAccessibilityContext('bad')).toEqual({});
  });

  it('maps stadium name and currentOccupancy', () => {
    const ctx = buildAccessibilityContext(FULL_CTX);
    expect(ctx.stadium.name).toBe('MetLife Stadium');
    expect(ctx.stadium.currentOccupancy).toBe(70000);
  });

  it('only includes accessible gates', () => {
    const ctx = buildAccessibilityContext(FULL_CTX);
    expect(ctx.gates).toHaveLength(1); // only gate A is accessible
    expect(ctx.gates[0].id).toBe('A');
  });

  it('maps id, direction, waitTimeMinutes, status, accessibleFeatures for accessible gates', () => {
    const ctx = buildAccessibilityContext(FULL_CTX);
    expect(ctx.gates[0]).toMatchObject({
      id: 'A',
      direction: 'North',
      waitTimeMinutes: 5,
      status: 'normal',
      accessibleFeatures: ['wheelchair ramp', 'audio guide'],
    });
  });

  it('falls back to [] for non-array accessibleFeatures on accessible gates', () => {
    const input = {
      stadium: { name: 'X', currentOccupancy: 0 },
      gates: [
        {
          id: 'Z',
          direction: 'East',
          waitTimeMinutes: 2,
          status: 'normal',
          accessible: true,
          accessibleFeatures: null,
        },
      ],
    };
    const ctx = buildAccessibilityContext(input);
    expect(ctx.gates[0].accessibleFeatures).toEqual([]);
  });

  it('returns empty gates when no accessible gates exist', () => {
    const input = {
      stadium: {},
      gates: [{ id: 'B', direction: 'South', accessible: false }],
    };
    const ctx = buildAccessibilityContext(input);
    expect(ctx.gates).toEqual([]);
  });

  it('returns empty gates when gates is not an array', () => {
    const ctx = buildAccessibilityContext({ stadium: {} });
    expect(ctx.gates).toEqual([]);
  });

  it('does NOT include incidents, transport, or sustainability', () => {
    const ctx = buildAccessibilityContext(FULL_CTX);
    expect(ctx.incidents).toBeUndefined();
    expect(ctx.transport).toBeUndefined();
    expect(ctx.sustainability).toBeUndefined();
  });
});
