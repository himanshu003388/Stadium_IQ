import { Router } from 'express';
import crypto from 'crypto';
import { authenticateApiKey, csrfProtection } from '../middleware/auth.js';
import { getGenAI, getBestAvailableModel } from '../utils/genai.js';
import { sanitizeInput } from '../utils/validation.js';

const router = Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

router.post('/api/ai/translate', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  const { text, targetLanguage } = req.body;

  if (!text || typeof text !== 'string') {
    return res
      .status(400)
      .json({ error: 'Text parameter is required and must be a string.', requestId });
  }
  if (!targetLanguage || typeof targetLanguage !== 'string') {
    return res
      .status(400)
      .json({ error: 'TargetLanguage parameter is required and must be a string.', requestId });
  }

  const cleanText = sanitizeInput(text);
  const cleanLang = sanitizeInput(targetLanguage).toUpperCase();

  try {
    const genAI = getGenAI();
    if (genAI && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
      const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: selectedModel });

      const prompt = `Translate the following text into ${cleanLang}. Output ONLY the direct translated text. Do not include quotes, prefix text, explanations or formatting:
"${cleanText}"`;

      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();
      return res.json({ translatedText: translated, requestId });
    }

    // Heuristic mock fallback
    const fallbackText = `"${cleanText}" (Translated to ${cleanLang})`;
    res.json({ translatedText: fallbackText, requestId, fallback: true });
  } catch (err) {
    console.error(`[${requestId}] Translation error:`, err);
    const fallbackText = `"${cleanText}" (Translated to ${cleanLang})`;
    res.json({ translatedText: fallbackText, requestId, fallback: true });
  }
});

export default router;
