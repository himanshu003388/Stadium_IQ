/**
 * styles.js — coverage tests
 * Exercises all exported style constants and color maps.
 */
import { describe, it, expect } from 'vitest';
import {
  COLORS,
  ZONE_COLORS,
  PRIORITY_COLORS,
  PRIORITY_BG,
  LANG_FLAGS,
  GATE_STATUS_COLORS,
  TRANSPORT_ICONS,
  NAV_ITEMS,
  QUICK_PROMPTS,
} from '../styles';

describe('COLORS', () => {
  it('has surface color token', () => {
    expect(COLORS.surface).toContain('surface');
  });

  it('has primary color token', () => {
    expect(COLORS.primary).toContain('primary');
  });

  it('has warning, error, success, info', () => {
    expect(COLORS.warning).toContain('warning');
    expect(COLORS.error).toContain('error');
    expect(COLORS.success).toContain('success');
    expect(COLORS.info).toContain('info');
  });

  it('has statusCritical, statusBusy, statusNominal', () => {
    expect(COLORS.statusCritical).toContain('critical');
    expect(COLORS.statusBusy).toContain('busy');
    expect(COLORS.statusNominal).toContain('nominal');
  });

  it('has gradientNavy as a gradient string', () => {
    expect(COLORS.gradientNavy).toContain('gradient');
  });
});

describe('ZONE_COLORS', () => {
  const zones = ['north', 'south', 'east', 'west', 'nominal', 'busy', 'moderate', 'critical'];

  it('has all required zones', () => {
    for (const zone of zones) {
      expect(ZONE_COLORS[zone]).toBeDefined();
    }
  });

  it('each zone has fill, bg, text, label', () => {
    for (const zone of zones) {
      expect(ZONE_COLORS[zone]).toHaveProperty('fill');
      expect(ZONE_COLORS[zone]).toHaveProperty('bg');
      expect(ZONE_COLORS[zone]).toHaveProperty('text');
      expect(ZONE_COLORS[zone]).toHaveProperty('label');
    }
  });

  it('north zone fill is blue-ish', () => {
    expect(ZONE_COLORS.north.fill).toBe('#2563EB');
  });

  it('critical zone fill is red-ish', () => {
    expect(ZONE_COLORS.critical.fill).toBe('#EF4444');
  });
});

describe('PRIORITY_COLORS', () => {
  it('has high, medium, low', () => {
    expect(PRIORITY_COLORS.high).toBeDefined();
    expect(PRIORITY_COLORS.medium).toBeDefined();
    expect(PRIORITY_COLORS.low).toBeDefined();
  });

  it('high priority is red-ish', () => {
    expect(PRIORITY_COLORS.high).toBe('#C62828');
  });
});

describe('PRIORITY_BG', () => {
  it('has high, medium, low backgrounds with rgba', () => {
    expect(PRIORITY_BG.high).toContain('rgba');
    expect(PRIORITY_BG.medium).toContain('rgba');
    expect(PRIORITY_BG.low).toContain('rgba');
  });
});

describe('LANG_FLAGS', () => {
  it('has flags for all 7 supported languages', () => {
    const langs = ['en', 'es', 'fr', 'ar', 'pt', 'ja', 'hi'];
    for (const lang of langs) {
      expect(LANG_FLAGS[lang]).toBeDefined();
    }
  });

  it('English flag is US flag emoji', () => {
    expect(LANG_FLAGS.en).toBe('🇺🇸');
  });
});

describe('GATE_STATUS_COLORS', () => {
  it('has normal, watch, critical gate statuses', () => {
    expect(GATE_STATUS_COLORS.normal).toBeDefined();
    expect(GATE_STATUS_COLORS.watch).toBeDefined();
    expect(GATE_STATUS_COLORS.critical).toBeDefined();
  });

  it('each status has bg, text, label', () => {
    for (const status of ['normal', 'watch', 'critical']) {
      expect(GATE_STATUS_COLORS[status]).toHaveProperty('bg');
      expect(GATE_STATUS_COLORS[status]).toHaveProperty('text');
      expect(GATE_STATUS_COLORS[status]).toHaveProperty('label');
    }
  });
});

describe('TRANSPORT_ICONS', () => {
  const modes = ['subway', 'bus', 'shuttle', 'train', 'rideshare', 'parking', 'walking'];

  it('has icon for every transport mode', () => {
    for (const mode of modes) {
      expect(TRANSPORT_ICONS[mode]).toBeDefined();
    }
  });

  it('subway icon is "subway"', () => {
    expect(TRANSPORT_ICONS.subway).toBe('subway');
  });
});

describe('NAV_ITEMS', () => {
  it('has at least 9 navigation items', () => {
    expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(9);
  });

  it('every item has id, icon, label, desc, allowedRoles', () => {
    for (const item of NAV_ITEMS) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('desc');
      expect(item).toHaveProperty('allowedRoles');
      expect(Array.isArray(item.allowedRoles)).toBe(true);
    }
  });

  it('dashboard item allows organizer and staff', () => {
    const dashboard = NAV_ITEMS.find((i) => i.id === 'dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard.allowedRoles).toContain('organizer');
    expect(dashboard.allowedRoles).toContain('staff');
  });

  it('volunteer-mobile item is restricted to volunteer role', () => {
    const vm = NAV_ITEMS.find((i) => i.id === 'volunteer-mobile');
    expect(vm).toBeDefined();
    expect(vm.allowedRoles).toEqual(['volunteer']);
  });
});

describe('QUICK_PROMPTS', () => {
  it('has 6 quick prompts', () => {
    expect(QUICK_PROMPTS).toHaveLength(6);
  });

  it('every prompt has text and icon', () => {
    for (const prompt of QUICK_PROMPTS) {
      expect(prompt).toHaveProperty('text');
      expect(prompt).toHaveProperty('icon');
    }
  });

  it('first prompt is about gates', () => {
    expect(QUICK_PROMPTS[0].text).toContain('gate');
  });
});
