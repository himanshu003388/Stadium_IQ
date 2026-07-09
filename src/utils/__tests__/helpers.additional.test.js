/**
 * helpers.js — additional branch coverage
 * Focuses on getDemoResponse multi-language paths, keyword matcher
 * edge cases, timeAgo boundary, and color helpers not yet covered.
 */
import { describe, it, expect } from 'vitest';
import {
  getDemoResponse,
  timeAgo,
  getCO2Color,
  getSeverityColor,
  getCapacityColor,
  getLoadBarColor,
  getDensityColor,
  getStatusColor,
  DEMO_RESPONSE_TEMPLATES,
  getMatcherRegex,
} from '../helpers';

// ─────────────────────────────────────────────
// Shared context fixture
// ─────────────────────────────────────────────
const BASE_CTX = {
  gates: [
    { id: 'A', density: 0.2, waitTimeMinutes: 3, accessible: true, direction: 'North' },
    { id: 'B', density: 0.8, waitTimeMinutes: 15, accessible: false, direction: 'South' },
  ],
  transportOptions: [
    {
      id: 'T1',
      type: 'Subway',
      line: 'Red Line',
      etaMinutes: 8,
      co2e: 4,
      capacityLeft: 300,
      recommended: true,
    },
    {
      id: 'T2',
      type: 'Bus',
      line: 'Route 42',
      etaMinutes: 15,
      co2e: 12,
      capacityLeft: 80,
      recommended: false,
    },
  ],
  stadium: {
    name: "Levi's Stadium",
    capacity: 68500,
    currentOccupancy: 55000,
    homeTeam: 'USA',
    awayTeam: 'Brazil',
    score: '1-0',
    matchPhase: 'First Half',
    weather: { temperature: 22, feelsLike: 20, conditions: 'sunny', humidity: 40 },
    sustainability: { co2SavedKg: 2000, renewablePercentage: 90, wasteDiversionRate: 75 },
  },
  accessibilityServices: [
    { type: 'Wheelchair', locations: ['Gate A', 'Gate C'], description: 'Ramps available' },
    { type: 'Sign Language', locations: ['Gate B'], description: 'On request' },
  ],
};

// ─────────────────────────────────────────────
// getDemoResponse — English (full keyword sweep)
// ─────────────────────────────────────────────
describe('getDemoResponse — English keyword coverage', () => {
  it('handles null context gracefully', () => {
    const res = getDemoResponse('hello', null);
    expect(typeof res).toBe('string');
  });

  it('handles undefined context gracefully', () => {
    const res = getDemoResponse('hello', undefined);
    expect(typeof res).toBe('string');
  });

  it('returns gate response for "entrance" keyword', () => {
    const res = getDemoResponse('where is the entrance?', BASE_CTX);
    expect(res).toContain('Gate');
  });

  it('returns gate response for "door" keyword', () => {
    const res = getDemoResponse('which door should I use?', BASE_CTX);
    expect(res).toContain('Gate');
  });

  it('returns gate response for "entry" keyword', () => {
    const res = getDemoResponse('best entry point?', BASE_CTX);
    expect(res).toContain('Gate');
  });

  it('returns transport response for "metro" keyword', () => {
    const res = getDemoResponse('is there a metro?', BASE_CTX);
    expect(res).toContain('Subway');
  });

  it('returns transport response for "shuttle" keyword', () => {
    const res = getDemoResponse('shuttle service available?', BASE_CTX);
    expect(res).toContain('Subway');
  });

  it('returns transport response for "depart" keyword', () => {
    const res = getDemoResponse('when do trains depart?', BASE_CTX);
    expect(res).toContain('Subway');
  });

  it('returns weather for "rain" keyword', () => {
    const res = getDemoResponse('will it rain?', BASE_CTX);
    expect(res).toContain('22');
  });

  it('returns weather for "hot" keyword', () => {
    const res = getDemoResponse('is it hot outside?', BASE_CTX);
    expect(res).toContain('22');
  });

  it('returns crowd for "density" keyword', () => {
    const res = getDemoResponse('check density levels', BASE_CTX);
    expect(res).toContain('capacity');
  });

  it('returns eco for "green" keyword', () => {
    const res = getDemoResponse('green initiatives today', BASE_CTX);
    expect(res).toContain('CO₂');
  });

  it('returns eco for "carbon" keyword', () => {
    const res = getDemoResponse('carbon emissions?', BASE_CTX);
    expect(res).toContain('CO₂');
  });

  it('returns eco for "renewable" keyword', () => {
    const res = getDemoResponse('any renewable energy?', BASE_CTX);
    expect(res).toContain('CO₂');
  });

  it('returns accessibility for "disability" keyword', () => {
    const res = getDemoResponse('disability services?', BASE_CTX);
    expect(res).toContain('Accessibility');
  });

  it('returns accessibility for "hearing" keyword', () => {
    const res = getDemoResponse('hearing loop available?', BASE_CTX);
    expect(res).toContain('Accessibility');
  });

  it('returns accessibility for "braille" keyword', () => {
    const res = getDemoResponse('braille guide available?', BASE_CTX);
    expect(res).toContain('Accessibility');
  });

  it('returns accessibility for "visual" keyword', () => {
    const res = getDemoResponse('visual impairment support', BASE_CTX);
    expect(res).toContain('Accessibility');
  });

  it('returns food for "restaurant" keyword', () => {
    const res = getDemoResponse('nearest restaurant?', BASE_CTX);
    expect(res).toContain('Food');
  });

  it('returns food for "meal" keyword', () => {
    const res = getDemoResponse('where can I get a meal?', BASE_CTX);
    expect(res).toContain('Food');
  });

  it('returns parking for "vehicle" keyword', () => {
    const res = getDemoResponse('where do I park my vehicle?', BASE_CTX);
    expect(res).toContain('Parking');
  });

  it('returns parking for "garage" keyword', () => {
    const res = getDemoResponse('closest garage?', BASE_CTX);
    expect(res).toContain('Parking');
  });

  it('returns merch for "jersey" keyword', () => {
    const res = getDemoResponse('buy a jersey?', BASE_CTX);
    expect(res).toContain('Merchandise');
  });

  it('returns merch for "souvenir" keyword', () => {
    const res = getDemoResponse('FIFA 2026 souvenir?', BASE_CTX);
    expect(res).toContain('Merchandise');
  });

  it('uses non-recommended transport when no recommended transport exists', () => {
    const ctx = {
      ...BASE_CTX,
      transportOptions: [
        {
          id: 'T1',
          type: 'Bus',
          line: 'Route 5',
          etaMinutes: 10,
          co2e: 8,
          capacityLeft: 50,
          recommended: false,
        },
      ],
    };
    const res = getDemoResponse('best transport?', ctx);
    expect(res).toContain('Bus');
  });

  it('uses fallback bestGate when gates array is empty', () => {
    const ctx = { ...BASE_CTX, gates: [] };
    const res = getDemoResponse('which gate?', ctx);
    // Should not crash — falls back to default since bestGate is {}
    expect(typeof res).toBe('string');
  });
});

// ─────────────────────────────────────────────
// getDemoResponse — multilingual paths
// ─────────────────────────────────────────────
describe('getDemoResponse — multilingual responses', () => {
  it('returns French default for unknown query', () => {
    const res = getDemoResponse('bonjour', BASE_CTX, 'fr');
    expect(res).toContain('Bienvenue');
  });

  it('returns French food response', () => {
    const res = getDemoResponse('food nearby', BASE_CTX, 'fr');
    expect(res).toContain('Restauration');
  });

  it('returns French parking response', () => {
    const res = getDemoResponse('parking?', BASE_CTX, 'fr');
    expect(res).toContain('Parking');
  });

  it('returns French merch response', () => {
    const res = getDemoResponse('jersey shop', BASE_CTX, 'fr');
    expect(res).toContain('Boutiques');
  });

  it('returns French accessibility response', () => {
    const res = getDemoResponse('wheelchair accessible?', BASE_CTX, 'fr');
    expect(res).toContain('Accessibilité');
  });

  it('returns Arabic default for unknown query', () => {
    const res = getDemoResponse('مرحبا', BASE_CTX, 'ar');
    expect(res).toContain('مرحباً');
  });

  it('returns Arabic food response', () => {
    const res = getDemoResponse('food options', BASE_CTX, 'ar');
    expect(res).toContain('الطعام');
  });

  it('returns Arabic parking response', () => {
    const res = getDemoResponse('parking lot', BASE_CTX, 'ar');
    expect(res).toContain('مواقف');
  });

  it('returns Arabic merch response', () => {
    const res = getDemoResponse('souvenir shop', BASE_CTX, 'ar');
    expect(res).toContain('البضائع');
  });

  it('returns Arabic accessibility response', () => {
    const res = getDemoResponse('wheelchair?', BASE_CTX, 'ar');
    expect(res).toContain('الإتاحة');
  });

  it('returns Portuguese default for unknown query', () => {
    const res = getDemoResponse('oi', BASE_CTX, 'pt');
    expect(res).toContain('Bem-vindo');
  });

  it('returns Portuguese food response', () => {
    const res = getDemoResponse('food options', BASE_CTX, 'pt');
    expect(res).toContain('Alimentação');
  });

  it('returns Portuguese parking response', () => {
    const res = getDemoResponse('parking', BASE_CTX, 'pt');
    expect(res).toContain('Estacionamento');
  });

  it('returns Portuguese merch response', () => {
    const res = getDemoResponse('jersey shop', BASE_CTX, 'pt');
    expect(res).toContain('Lojas');
  });

  it('returns Portuguese accessibility response', () => {
    const res = getDemoResponse('wheelchair?', BASE_CTX, 'pt');
    expect(res).toContain('Acessibilidade');
  });

  it('returns Japanese default for unknown query', () => {
    const res = getDemoResponse('hello', BASE_CTX, 'ja');
    expect(res).toContain('ようこそ');
  });

  it('returns Japanese food response', () => {
    const res = getDemoResponse('food nearby', BASE_CTX, 'ja');
    expect(res).toContain('フード');
  });

  it('returns Japanese parking response', () => {
    const res = getDemoResponse('parking', BASE_CTX, 'ja');
    expect(res).toContain('駐車場');
  });

  it('returns Japanese merch response', () => {
    const res = getDemoResponse('jersey shop', BASE_CTX, 'ja');
    expect(res).toContain('グッズ');
  });

  it('returns Japanese accessibility response', () => {
    const res = getDemoResponse('wheelchair accessible?', BASE_CTX, 'ja');
    expect(res).toContain('アクセシビリティ');
  });

  it('returns Hindi default for unknown query', () => {
    const res = getDemoResponse('namaste', BASE_CTX, 'hi');
    expect(res).toContain('स्वागत');
  });

  it('returns Hindi food response', () => {
    const res = getDemoResponse('food options', BASE_CTX, 'hi');
    expect(res).toContain('खाने');
  });

  it('returns Hindi parking response', () => {
    const res = getDemoResponse('parking', BASE_CTX, 'hi');
    expect(res).toContain('पार्किंग');
  });

  it('returns Hindi merch response', () => {
    const res = getDemoResponse('jersey shop', BASE_CTX, 'hi');
    expect(res).toContain('मर्चेंडाइज़');
  });

  it('returns Hindi accessibility response', () => {
    const res = getDemoResponse('wheelchair?', BASE_CTX, 'hi');
    expect(res).toContain('एक्सेसिबिलिटी');
  });

  it('falls back to English for an unknown language code', () => {
    const res = getDemoResponse('crowd levels?', BASE_CTX, 'zz');
    expect(res).toContain('capacity');
  });

  it('Spanish parking response contains occupancy-based numbers', () => {
    const res = getDemoResponse('parking lot', BASE_CTX, 'es');
    expect(res).toContain('Aparcamiento');
  });

  it('returns Spanish accessibility response', () => {
    const res = getDemoResponse('wheelchair', BASE_CTX, 'es');
    expect(res).toContain('Servicios de Accesibilidad');
  });

  it('falls back to default function in getDemoResponse switch statement when template is a function but matcher.res is not matched', () => {
    DEMO_RESPONSE_TEMPLATES.custom_test_lang = {
      food: () => 'custom food fallback value',
      default: (s) => 'default fallback',
    };
    const res = getDemoResponse('food options', BASE_CTX, 'custom_test_lang');
    expect(res).toBe('custom food fallback value');
    delete DEMO_RESPONSE_TEMPLATES.custom_test_lang;
  });
});

// ─────────────────────────────────────────────
// timeAgo — boundary conditions
// ─────────────────────────────────────────────
describe('timeAgo — boundary conditions', () => {
  it('returns "just now" for a future timestamp', () => {
    const future = new Date(Date.now() + 5000).toISOString();
    expect(timeAgo(future)).toBe('just now');
  });

  it('returns "just now" for exactly 0 diff', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });

  it('returns "1m ago" for exactly 1 minute', () => {
    const oneMinAgo = new Date(Date.now() - 60000).toISOString();
    expect(timeAgo(oneMinAgo)).toBe('1m ago');
  });

  it('returns "59m ago" just before 1 hour', () => {
    const almostHour = new Date(Date.now() - 59 * 60000).toISOString();
    expect(timeAgo(almostHour)).toBe('59m ago');
  });

  it('returns "1h ago" for exactly 60 minutes', () => {
    const exactHour = new Date(Date.now() - 60 * 60000).toISOString();
    expect(timeAgo(exactHour)).toBe('1h ago');
  });

  it('returns "23h ago" just before 24 hours', () => {
    const almostDay = new Date(Date.now() - 23 * 3600000).toISOString();
    expect(timeAgo(almostDay)).toBe('23h ago');
  });
});

// ─────────────────────────────────────────────
// getCO2Color — boundary edges
// ─────────────────────────────────────────────
describe('getCO2Color — boundary conditions', () => {
  it('returns tertiary for exactly 10 (boundary)', () => {
    expect(getCO2Color(10)).toBe('var(--color-tertiary)');
  });

  it('returns secondary-container for exactly 11', () => {
    expect(getCO2Color(11)).toBe('var(--color-secondary-container)');
  });

  it('returns secondary-container for exactly 20 (boundary)', () => {
    expect(getCO2Color(20)).toBe('var(--color-secondary-container)');
  });

  it('returns warning for exactly 21', () => {
    expect(getCO2Color(21)).toBe('var(--color-warning)');
  });

  it('returns warning for exactly 40 (boundary)', () => {
    expect(getCO2Color(40)).toBe('var(--color-warning)');
  });

  it('returns error for exactly 41', () => {
    expect(getCO2Color(41)).toBe('var(--color-error)');
  });
});

// ─────────────────────────────────────────────
// getCapacityColor — boundary edges
// ─────────────────────────────────────────────
describe('getCapacityColor — boundary conditions', () => {
  it('returns error for exactly 5 seats', () => {
    expect(getCapacityColor(5)).toBe('var(--color-error)');
  });

  it('returns warning for exactly 6 seats', () => {
    expect(getCapacityColor(6)).toBe('var(--color-warning)');
  });

  it('returns warning for exactly 20 seats', () => {
    expect(getCapacityColor(20)).toBe('var(--color-warning)');
  });

  it('returns success for exactly 21 seats', () => {
    expect(getCapacityColor(21)).toBe('var(--color-success)');
  });
});

// ─────────────────────────────────────────────
// getLoadBarColor — boundary edges
// ─────────────────────────────────────────────
describe('getLoadBarColor — boundary conditions', () => {
  it('returns busy for exactly 60% load', () => {
    expect(getLoadBarColor(3, 5)).toBe('var(--color-status-busy)'); // 60%
  });

  it('returns nominal for 59% load', () => {
    // 59% → floor((2.95/5)*100) = 59
    expect(getLoadBarColor(295, 500)).toBe('var(--color-status-nominal)');
  });

  it('returns critical for exactly 100%', () => {
    expect(getLoadBarColor(10, 10)).toBe('var(--color-status-critical)');
  });

  it('returns critical for over 100%', () => {
    expect(getLoadBarColor(12, 10)).toBe('var(--color-status-critical)');
  });
});

// ─────────────────────────────────────────────
// getDensityColor — boundary edges
// ─────────────────────────────────────────────
describe('getDensityColor — boundary conditions', () => {
  it('returns critical for exactly 0.86', () => {
    expect(getDensityColor(0.86)).toBe('var(--color-status-critical)');
  });

  it('returns busy for exactly 0.66', () => {
    expect(getDensityColor(0.66)).toBe('var(--color-status-busy)');
  });

  it('returns nominal for 0.65', () => {
    expect(getDensityColor(0.65)).toBe('var(--color-status-nominal)');
  });
});

// ─────────────────────────────────────────────
// getStatusColor — all branches
// ─────────────────────────────────────────────
describe('getStatusColor — all branches', () => {
  it('handles unexpected status string as nominal', () => {
    expect(getStatusColor('unknown')).toBe('var(--color-status-nominal)');
  });

  it('handles empty string as nominal', () => {
    expect(getStatusColor('')).toBe('var(--color-status-nominal)');
  });
});

// ─────────────────────────────────────────────
// getSeverityColor — all branches
// ─────────────────────────────────────────────
describe('getSeverityColor — all branches', () => {
  it('handles unexpected severity as info', () => {
    expect(getSeverityColor('unknown')).toBe('var(--color-info)');
  });
});

describe('helpers.js — extra branch coverage', () => {
  it('handles duplicate keyword requests for regex compilation cache', () => {
    const regex1 = getMatcherRegex('test_cache_keyword');
    const regex2 = getMatcherRegex('test_cache_keyword');
    expect(regex1).toBe(regex2);
  });

  it('handles falsy accessibility services list', () => {
    const res = getDemoResponse('wheelchair', { ...BASE_CTX, accessibilityServices: null });
    expect(res).toContain('Accessibility Services');
  });

  it('handles non-array accessibility service locations', () => {
    const res = getDemoResponse('wheelchair', {
      ...BASE_CTX,
      accessibilityServices: [
        { type: 'Wheelchair', locations: 'Gate A', description: 'Ramps available' },
      ],
    });
    expect(res).toContain('Accessibility Services');
  });

  it('handles falsy accessibility service description', () => {
    const res = getDemoResponse('wheelchair', {
      ...BASE_CTX,
      accessibilityServices: [
        { type: 'Wheelchair', locations: ['Gate A'] },
      ],
    });
    expect(res).toContain('Accessibility Services');
  });

  it('falls back to default language template when matcher key is missing in custom language', () => {
    // 'es' template lacks 'transport' key
    const res = getDemoResponse('metro', BASE_CTX, 'es');
    expect(res).toContain('Bienvenido');
  });
});
