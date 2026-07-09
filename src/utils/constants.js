/**
 * Severity badge mapping
 */
export const SEVERITY_BADGE_MAP = {
  critical: 'badge-critical',
  medium: 'badge-warning',
  low: 'badge-info',
  resolved: 'badge-success',
};

/**
 * Status dot colors — theme-aware
 */
export const STATUS_DOT_COLORS = {
  critical: 'var(--color-status-critical)',
  active: 'var(--color-status-moderate)',
  resolved: 'var(--color-status-nominal)',
  watch: 'var(--color-status-busy)',
};

/**
 * Available languages
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

/**
 * Incident type icons
 */
export const INCIDENT_ICON_MAP = {
  crowd: 'groups',
  facility: 'home_repair_service',
  equipment: 'build_circle',
  medical: 'medical_services',
  security: 'security',
};

/**
 * Eco score thresholds
 */
export const ECO_SCORE_THRESHOLDS = {
  zero: 0,
  low: 10,
  moderate: 20,
  high: 40,
};

/**
 * API input limits — shared between client validation and server validation
 */
export const API_LIMITS = {
  /** Maximum character length for a chat message */
  MAX_CHAT_MESSAGE_LENGTH: 2000,
  /** Maximum character length for translation input */
  MAX_TRANSLATE_TEXT_LENGTH: 2000,
  /** Maximum character length for target language code */
  MAX_LANG_CODE_LENGTH: 10,
  /** Maximum JSON size for contextData sent to AI (characters) */
  MAX_CONTEXT_JSON_LENGTH: 5000,
  /** Maximum character length for AI response before truncation */
  MAX_AI_RESPONSE_LENGTH: 10000,
};

/**
 * Server-side cache and rate-limit configuration
 */
export const SERVER_CONFIG = {
  /** Model selection cache TTL in milliseconds (1 hour) */
  MODEL_CACHE_TTL_MS: 3_600_000,
  /** CSRF token expiry in seconds (1 hour) */
  CSRF_TOKEN_EXPIRY_SECONDS: 3600,
  /** Rate limit window in milliseconds (1 minute) */
  RATE_LIMIT_WINDOW_MS: 60_000,
  /** Max API requests per window */
  RATE_LIMIT_API_MAX: 30,
  /** Max CSRF token requests per window */
  RATE_LIMIT_CSRF_MAX: 10,
  /** Request body size limit */
  REQUEST_BODY_LIMIT: '10kb',
};
