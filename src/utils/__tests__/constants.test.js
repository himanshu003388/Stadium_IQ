/**
 * constants.js — coverage tests
 * Exercises all exported constants to ensure they are imported
 * and their structure matches expectations, raising line/statement coverage.
 */
import { describe, it, expect } from 'vitest';
import {
  SEVERITY_BADGE_MAP,
  STATUS_DOT_COLORS,
  LANGUAGES,
  INCIDENT_ICON_MAP,
  ECO_SCORE_THRESHOLDS,
  API_LIMITS,
  SERVER_CONFIG,
} from '../constants';

describe('SEVERITY_BADGE_MAP', () => {
  it('maps critical to badge-critical', () => {
    expect(SEVERITY_BADGE_MAP.critical).toBe('badge-critical');
  });

  it('maps medium to badge-warning', () => {
    expect(SEVERITY_BADGE_MAP.medium).toBe('badge-warning');
  });

  it('maps low to badge-info', () => {
    expect(SEVERITY_BADGE_MAP.low).toBe('badge-info');
  });

  it('maps resolved to badge-success', () => {
    expect(SEVERITY_BADGE_MAP.resolved).toBe('badge-success');
  });
});

describe('STATUS_DOT_COLORS', () => {
  it('has critical status color', () => {
    expect(STATUS_DOT_COLORS.critical).toContain('critical');
  });

  it('has active status color', () => {
    expect(STATUS_DOT_COLORS.active).toContain('moderate');
  });

  it('has resolved status color', () => {
    expect(STATUS_DOT_COLORS.resolved).toContain('nominal');
  });

  it('has watch status color', () => {
    expect(STATUS_DOT_COLORS.watch).toContain('busy');
  });
});

describe('LANGUAGES', () => {
  it('contains exactly 7 language entries', () => {
    expect(LANGUAGES).toHaveLength(7);
  });

  it('has English as first entry', () => {
    expect(LANGUAGES[0].code).toBe('en');
    expect(LANGUAGES[0].label).toBe('English');
  });

  it('has Spanish entry', () => {
    const es = LANGUAGES.find((l) => l.code === 'es');
    expect(es).toBeDefined();
    expect(es.label).toBe('Español');
  });

  it('has Hindi entry', () => {
    const hi = LANGUAGES.find((l) => l.code === 'hi');
    expect(hi).toBeDefined();
  });

  it('every language has code, label, and flag', () => {
    for (const lang of LANGUAGES) {
      expect(lang).toHaveProperty('code');
      expect(lang).toHaveProperty('label');
      expect(lang).toHaveProperty('flag');
    }
  });
});

describe('INCIDENT_ICON_MAP', () => {
  it('maps crowd incidents', () => {
    expect(INCIDENT_ICON_MAP.crowd).toBe('groups');
  });

  it('maps facility incidents', () => {
    expect(INCIDENT_ICON_MAP.facility).toBe('home_repair_service');
  });

  it('maps medical incidents', () => {
    expect(INCIDENT_ICON_MAP.medical).toBe('medical_services');
  });

  it('maps security incidents', () => {
    expect(INCIDENT_ICON_MAP.security).toBe('security');
  });

  it('maps equipment incidents', () => {
    expect(INCIDENT_ICON_MAP.equipment).toBe('build_circle');
  });
});

describe('ECO_SCORE_THRESHOLDS', () => {
  it('has zero threshold at 0', () => {
    expect(ECO_SCORE_THRESHOLDS.zero).toBe(0);
  });

  it('has low threshold at 10', () => {
    expect(ECO_SCORE_THRESHOLDS.low).toBe(10);
  });

  it('has moderate threshold at 20', () => {
    expect(ECO_SCORE_THRESHOLDS.moderate).toBe(20);
  });

  it('has high threshold at 40', () => {
    expect(ECO_SCORE_THRESHOLDS.high).toBe(40);
  });
});

describe('API_LIMITS', () => {
  it('has MAX_CHAT_MESSAGE_LENGTH of 2000', () => {
    expect(API_LIMITS.MAX_CHAT_MESSAGE_LENGTH).toBe(2000);
  });

  it('has MAX_TRANSLATE_TEXT_LENGTH of 2000', () => {
    expect(API_LIMITS.MAX_TRANSLATE_TEXT_LENGTH).toBe(2000);
  });

  it('has MAX_LANG_CODE_LENGTH of 10', () => {
    expect(API_LIMITS.MAX_LANG_CODE_LENGTH).toBe(10);
  });

  it('has MAX_CONTEXT_JSON_LENGTH of 5000', () => {
    expect(API_LIMITS.MAX_CONTEXT_JSON_LENGTH).toBe(5000);
  });

  it('has MAX_AI_RESPONSE_LENGTH of 10000', () => {
    expect(API_LIMITS.MAX_AI_RESPONSE_LENGTH).toBe(10000);
  });
});

describe('SERVER_CONFIG', () => {
  it('has MODEL_CACHE_TTL_MS of 1 hour (3600000)', () => {
    expect(SERVER_CONFIG.MODEL_CACHE_TTL_MS).toBe(3_600_000);
  });

  it('has CSRF_TOKEN_EXPIRY_SECONDS of 3600', () => {
    expect(SERVER_CONFIG.CSRF_TOKEN_EXPIRY_SECONDS).toBe(3600);
  });

  it('has RATE_LIMIT_WINDOW_MS of 60000', () => {
    expect(SERVER_CONFIG.RATE_LIMIT_WINDOW_MS).toBe(60_000);
  });

  it('has RATE_LIMIT_API_MAX of 30', () => {
    expect(SERVER_CONFIG.RATE_LIMIT_API_MAX).toBe(30);
  });

  it('has RATE_LIMIT_CSRF_MAX of 10', () => {
    expect(SERVER_CONFIG.RATE_LIMIT_CSRF_MAX).toBe(10);
  });

  it('has REQUEST_BODY_LIMIT of "10kb"', () => {
    expect(SERVER_CONFIG.REQUEST_BODY_LIMIT).toBe('10kb');
  });
});
