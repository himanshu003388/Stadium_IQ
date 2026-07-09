import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './logger.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAIInstance = null;

export function getGenAI() {
  if (!genAIInstance && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
    genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAIInstance;
}

let cachedModelName = null;
let lastCheck = 0;
/** In-flight deduplication: a single Promise shared by all concurrent cold-cache callers */
let modelFetchInFlight = null;

/**
 * Dynamically selects the best available Gemini model, with a 1-hour cache
 * and in-flight deduplication to prevent thundering-herd on concurrent requests.
 * @returns {Promise<string>} The model name to use.
 */
export async function getBestAvailableModel() {
  if (cachedModelName && Date.now() - lastCheck < 3600000) {
    return cachedModelName;
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    return 'gemini-1.5-flash';
  }

  // If a fetch is already in flight, share it rather than making a duplicate request.
  if (modelFetchInFlight) {
    return modelFetchInFlight;
  }

  modelFetchInFlight = (async () => {
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      });
      if (!res.ok) return 'gemini-1.5-flash';
      const data = await res.json();

      const has25 = (data.models || []).some((m) => m.name.includes('gemini-2.5-flash'));
      cachedModelName = has25 ? 'gemini-2.5-flash' : 'gemini-1.5-flash';
      lastCheck = Date.now();

      logger.info(`[Auto-Select] Dynamically selected model: ${cachedModelName}`);
      return cachedModelName;
    } catch (err) {
      logger.error('Failed to dynamically fetch models, using fallback', err);
      return 'gemini-1.5-flash';
    } finally {
      modelFetchInFlight = null;
    }
  })();

  return modelFetchInFlight;
}

export function buildSystemPrompt(safeContext, language) {
  return `You are the AI Assistant for the FIFA World Cup 2026 Smart Stadiums operations center.
Your goal is to provide a GenAI-enabled solution that enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, and venue staff.
Specifically, you leverage Generative AI to improve navigation, crowd management, accessibility, transportation, sustainability, and multilingual assistance.
You have access to current stadium context including gate statuses, active incidents, crowd occupancy, and transport options.
Keep responses concise, actionable, and professional. Use formatting like bullet points where appropriate.
If the language requested is not English, respond in that language. Requested language code: ${language || 'en'}.

Current Stadium Context:
${safeContext}`;
}
