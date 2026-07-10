import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Generates a stable context digest that filters out granular simulation details
 * (such as exact occupancy and gate density values) and focuses on structural data
 * (active incident count/severity, gate closed statuses, match phase).
 * This ensures simulation timers do not continuously bust the cache.
 *
 * @param {object} ctx - Stadium context object.
 * @returns {string} SHA-256 hash digest.
 */
export function getStableContextDigest(ctx) {
  if (!ctx) return '';
  const stadium = ctx.stadium || {};
  // Bucket occupancy into 5% chunks to ensure minor changes don't bust the cache
  const capacity = stadium.capacity || 100000;
  const occupancy = stadium.currentOccupancy || 0;
  const occupancyBucket = Math.round((occupancy / capacity) * 20); // 0-20 representing 5% increments

  // Map gates status and accessibility
  const gates = (ctx.gates || [])
    .map((g) => `${g.id}:${g.status}:${g.accessible}`)
    .sort()
    .join(',');

  // Map active incidents
  const incidents = (ctx.incidents || [])
    .map((i) => `${i.id}:${i.type}:${i.severity}`)
    .sort()
    .join(',');

  const stableState = {
    matchPhase: stadium.matchPhase || '',
    score: stadium.score || '',
    occupancyBucket,
    gates,
    incidents,
  };

  return crypto.createHash('sha256').update(JSON.stringify(stableState)).digest('hex');
}

/**
 * Sanitizes user-supplied input using DOMPurify, then strips any residual
 * script tags and angle-bracket characters.
 *
 * @param {string} input - Raw user input.
 * @returns {string} Sanitised, trimmed string.
 */
export function doPurify(input) {
  if (typeof input !== 'string') return '';
  // 1. Pre-filter nested script tags to prevent DOMPurify from parsing them as plain text
  const preFiltered = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Primary HTML-aware defense via DOMPurify
  const purified = purify.sanitize(preFiltered);

  // 3. Decode HTML entities to allow regex filters to strip them
  const decoded = purified
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#96;/g, '`')
    .replace(/&amp;/g, '&');

  // 4. Secondary regex filters to remove HTML tags and raw special characters
  const clean = decoded
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .trim();

  return clean;
}

/**
 * Sanitizes AI response output — strips scripts and HTML tags, then truncates.
 * Extracted to eliminate duplication between stream and non-stream handlers.
 *
 * @param {string} text - Raw AI response text.
 * @param {number} [maxLen=10000] - Maximum character length.
 * @returns {string} Safe, truncated response.
 */
export function sanitizeOutput(text, maxLen = 10000) {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .slice(0, maxLen);
}
