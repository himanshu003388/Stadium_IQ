import { Router } from 'express';
import crypto from 'crypto';
import { authenticateApiKey, csrfProtection } from '../middleware/auth.js';
import { getGenAI, getBestAvailableModel } from '../utils/genai.js';
import { sanitizeInput } from '../utils/validation.js';
import { queryCache } from '../utils/cache.js';

const router = Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/** Maximum character length for translation input text */
const MAX_TEXT_LENGTH = 2000;
/** Maximum character length for target language code (e.g. 'EN', 'SPANISH') */
const MAX_LANG_LENGTH = 10;

router.post('/api/ai/translate', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  const { text, targetLanguage } = req.body;

  if (!text || typeof text !== 'string') {
    return res
      .status(400)
      .json({ error: 'Text parameter is required and must be a string.', requestId });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`,
      requestId,
    });
  }
  if (!targetLanguage || typeof targetLanguage !== 'string') {
    return res
      .status(400)
      .json({ error: 'TargetLanguage parameter is required and must be a string.', requestId });
  }
  if (targetLanguage.length > MAX_LANG_LENGTH) {
    return res.status(400).json({
      error: `TargetLanguage exceeds maximum length of ${MAX_LANG_LENGTH} characters.`,
      requestId,
    });
  }

  const cleanText = sanitizeInput(text);
  const cleanLang = sanitizeInput(targetLanguage).toUpperCase();

  const cacheKey = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        text: cleanText.toLowerCase().trim(),
        targetLanguage: cleanLang,
      }),
    )
    .digest('hex');

  const cachedTranslation = queryCache.get(cacheKey);
  if (cachedTranslation) {
    return res.json({ translatedText: cachedTranslation, requestId, cached: true });
  }

  try {
    const genAI = getGenAI();
    if (genAI && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
      const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: selectedModel });

      const prompt = `Translate the following text into ${cleanLang}. Output ONLY the direct translated text. Do not include quotes, prefix text, explanations or formatting:
"${cleanText}"`;

      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();
      queryCache.set(cacheKey, translated);
      return res.json({ translatedText: translated, requestId });
    }

    // Heuristic mock fallback
    const fallbackText = `"${cleanText}" (Translated to ${cleanLang})`;
    queryCache.set(cacheKey, fallbackText);
    res.json({ translatedText: fallbackText, requestId, fallback: true });
  } catch (err) {
    console.error(`[${requestId}] Translation error:`, err);
    const fallbackText = `"${cleanText}" (Translated to ${cleanLang})`;
    res.json({ translatedText: fallbackText, requestId, fallback: true });
  }
});

export default router;
