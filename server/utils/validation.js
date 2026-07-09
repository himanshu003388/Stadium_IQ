/**
 * Input validation and sanitisation utilities for the Stadium IQ API server.
 *
 * @module validation
 */

const VALID_LANGUAGES = ['en', 'es', 'fr', 'ar', 'pt', 'ja', 'hi'];

/**
 * Strips HTML tags, script blocks, and dangerous characters from user input.
 * Returns an empty string for non-string values.
 *
 * @param {*} input - Raw user input to sanitize.
 * @returns {string} A sanitised, trimmed string with no HTML or dangerous chars.
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  const clean = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .trim();
  return clean;
}

/**
 * Validates a chat request body, returning an array of error messages.
 * Checks message type/length, language code validity, and contextData structure.
 *
 * @param {*} body - The parsed JSON request body.
 * @returns {string[]} An array of human-readable error messages (empty if valid).
 */
export function validateChatInput(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    errors.push('Request body is required');
    return errors;
  }
  if (body.message !== undefined) {
    if (typeof body.message !== 'string') {
      errors.push('message must be a string');
    } else if (body.message.length > 2000) {
      errors.push('message must be max 2000 characters');
    } else if (body.message.trim().length === 0) {
      errors.push('message cannot be empty');
    }
  }
  if (body.language !== undefined) {
    if (!VALID_LANGUAGES.includes(body.language)) {
      errors.push('language must be a valid 2-letter ISO code');
    }
  }
  if (body.contextData !== undefined) {
    if (typeof body.contextData !== 'object') {
      errors.push('contextData must be an object');
    } else {
      const MAX_FIELD_LEN = 200;
      const stadium = body.contextData?.stadium;
      if (stadium) {
        if (typeof stadium.name === 'string' && stadium.name.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.name exceeds maximum length');
        if (typeof stadium.homeTeam === 'string' && stadium.homeTeam.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.homeTeam exceeds maximum length');
        if (typeof stadium.awayTeam === 'string' && stadium.awayTeam.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.awayTeam exceeds maximum length');
        if (typeof stadium.matchPhase === 'string' && stadium.matchPhase.length > 20)
          errors.push('contextData.stadium.matchPhase exceeds maximum length');
      }
    }
  }
  return errors;
}
