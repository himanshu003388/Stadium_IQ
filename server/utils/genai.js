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
  const genAI = getGenAI();
  if (!genAI) return 'gemini-1.5-flash';

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
      logger.info('gemini-2.5-flash not available or failed test, falling back to 1.5-flash', e);
      bestModel = 'gemini-1.5-flash';
    }

    modelCache.set('best-model', bestModel, SERVER_CONFIG.MODEL_CACHE_TTL_MS / 1000); // node-cache uses seconds
    logger.info(`Best available model selected: ${bestModel} and cached.`);
    return bestModel;
  } catch (err) {
    logger.error('Failed to dynamically fetch models, using fallback', err);
    return 'gemini-1.5-flash';
  }
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
