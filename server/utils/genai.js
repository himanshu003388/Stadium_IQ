import { GoogleGenerativeAI } from '@google/generative-ai';
import NodeCache from 'node-cache';
import logger from './logger.js';
import { SERVER_CONFIG } from '../../src/utils/constants.js';

let genAIInstance = null;
let lastApiKey = null;

/**
 * Instantiates and returns the GoogleGenerativeAI instance.
 * Re-instantiates the client dynamically if the environment API key is rotated or changed.
 * @returns {GoogleGenerativeAI|null} The GenAI client instance, or null if the key is missing/placeholder.
 */
export function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIInstance || lastApiKey !== apiKey) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
    lastApiKey = apiKey;
  }
  return genAIInstance;
}

const modelCache = new NodeCache({
  stdTTL: SERVER_CONFIG.MODEL_CACHE_TTL_MS / 1000,
  checkperiod: 60,
});
let activeModelPromise = null;

/**
 * Resets the GenAI module state, including caching, generative client references, and in-flight promises.
 * Exposed strictly for test isolation control.
 */
export function resetGenAIInstance() {
  genAIInstance = null;
  lastApiKey = null;
  activeModelPromise = null;
  modelCache.flushAll();
}

/**
 * Helper to identify runtime language/programmer exceptions.
 * @param {Error} err - The caught error instance.
 * @returns {boolean} True if the error is a JavaScript language error.
 */
function isProgrammerError(err) {
  return (
    err instanceof ReferenceError ||
    err instanceof TypeError ||
    err instanceof SyntaxError ||
    err instanceof RangeError ||
    err instanceof URIError
  );
}

/**
 * Dynamically selects the best available Gemini model, with a 1-hour cache
 * and in-flight deduplication to prevent thundering-herd on concurrent requests.
 * @returns {Promise<string>} The model name to use.
 */
export async function getBestAvailableModel() {
  const cached = modelCache.get('best-model');
  if (cached) {
    return cached;
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    return 'gemini-1.5-flash';
  }

  // If a fetch is already in flight, share it rather than making a duplicate request.
  if (activeModelPromise) {
    return activeModelPromise;
  }

  const genAI = getGenAI();
  if (!genAI) return 'gemini-1.5-flash';

  activeModelPromise = (async () => {
    try {
      let bestModel = 'gemini-1.5-flash';
      try {
        const testModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        // Very short test prompt
        await testModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
          generationConfig: { maxOutputTokens: 1 },
        });
        bestModel = 'gemini-2.5-flash';
      } catch (e) {
        if (isProgrammerError(e)) {
          throw e;
        }
        logger.info('gemini-2.5-flash not available or failed test, falling back to 1.5-flash', e);
        bestModel = 'gemini-1.5-flash';
      }

      modelCache.set('best-model', bestModel);
      logger.info(`Best available model selected: ${bestModel} and cached.`);
      return bestModel;
    } catch (err) {
      if (isProgrammerError(err)) {
        throw err;
      }
      logger.error('Failed to dynamically fetch models, using fallback', err);
      return 'gemini-1.5-flash';
    } finally {
      activeModelPromise = null;
    }
  })();

  return activeModelPromise;
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
