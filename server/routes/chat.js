import { Router } from 'express';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { authenticateApiKey, csrfProtection } from '../middleware/auth.js';
import { validateChatInput, sanitizeInput } from '../utils/validation.js';
import { getGenAI, getBestAvailableModel, buildSystemPrompt } from '../utils/genai.js';
import { queryCache } from '../utils/cache.js';

const window = new JSDOM('').window;
const purify = DOMPurify(window);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const router = Router();

function doPurify(input) {
  const clean = purify.sanitize(input);
  return clean
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .trim();
}

router.post('/api/chat', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  const startTime = Date.now();

  try {
    const validationErrors = validateChatInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }

    const { message, contextData, language } = req.body;
    const sanitizedMessage = doPurify(message);
    if (!sanitizedMessage) {
      return res
        .status(400)
        .json({ error: 'Message contains no valid content after sanitization.' });
    }

    const normalizedMessage = sanitizedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
    const cacheKey = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          message: normalizedMessage,
          language: (language || 'en').toLowerCase(),
          contextDigest: contextData
            ? crypto.createHash('sha256').update(JSON.stringify(contextData)).digest('hex')
            : '',
        }),
      )
      .digest('hex');
    const cachedResponse = queryCache.get(cacheKey);
    if (cachedResponse) {
      return res.json({ reply: cachedResponse, requestId, elapsed: 0, cached: true });
    }

    const genAI = getGenAI();
    if (!genAI) {
      return res
        .status(400)
        .json({ error: 'Gemini API Key is missing or invalid in server environment.' });
    }

    const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    const safeContext = JSON.stringify(contextData || {})
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .slice(0, 5000);
    const systemPrompt = buildSystemPrompt(safeContext, language);

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am ready to assist with stadium operations.' }],
        },
      ],
    });

    const result = await chat.sendMessage(sanitizedMessage);
    const responseText = result.response.text();
    const safeResponse = responseText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .slice(0, 10000);

    queryCache.set(cacheKey, safeResponse);
    const elapsed = Date.now() - startTime;

    res.json({ reply: safeResponse, requestId, elapsed });
  } catch (error) {
    console.error(`[${requestId}] Gemini API Error:`, error);
    if (
      error.status === 400 ||
      error.status === 403 ||
      (error.message && error.message.toLowerCase().includes('api key'))
    ) {
      return res
        .status(400)
        .json({ error: 'Gemini API Key is missing or invalid in server environment.', requestId });
    }
    res.status(500).json({ error: 'Failed to communicate with AI Assistant.', requestId });
  }
});

router.post('/api/chat/stream', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');

  const validationErrors = validateChatInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join('; ') });
  }

  const { message, contextData, language } = req.body;
  const sanitizedMessage = doPurify(message);
  if (!sanitizedMessage) {
    return res.status(400).json({ error: 'Message contains no valid content after sanitization.' });
  }

  const normalizedMessage = sanitizedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
  const cacheKey = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        message: normalizedMessage,
        language: (language || 'en').toLowerCase(),
      }),
    )
    .digest('hex');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  function safeWrite(data) {
    if (res.writableEnded || res.destroyed) return false;
    res.write(data);
    return true;
  }

  const cachedResponse = queryCache.get(cacheKey);
  if (cachedResponse) {
    safeWrite(`data: ${JSON.stringify({ chunk: cachedResponse, requestId })}\n\n`);
    safeWrite(`data: ${JSON.stringify({ done: true, requestId })}\n\n`);
    res.end();
    return;
  }

  const genAI = getGenAI();
  if (!genAI) {
    safeWrite(
      `data: ${JSON.stringify({ error: 'Gemini API Key is missing or invalid in server environment.', requestId })}\n\n`,
    );
    res.end();
    return;
  }

  const safeContext = JSON.stringify(contextData || {})
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .slice(0, 5000);
  const systemPrompt = buildSystemPrompt(safeContext, language);

  try {
    const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: selectedModel });
    const streamResult = await model.generateContentStream([
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${sanitizedMessage}` }] },
    ]);

    let fullText = '';
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        const safeChunk = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '');
        fullText += safeChunk;
        safeWrite(`data: ${JSON.stringify({ chunk: safeChunk, requestId })}\n\n`);
      }
    }
    if (fullText) {
      queryCache.set(cacheKey, fullText.slice(0, 10000));
    }
    safeWrite(`data: ${JSON.stringify({ done: true, requestId })}\n\n`);
  } catch (err) {
    console.error(`[${requestId}] Streaming error:`, err);
    if (
      err.status === 400 ||
      err.status === 403 ||
      (err.message && err.message.toLowerCase().includes('api key'))
    ) {
      safeWrite(
        `data: ${JSON.stringify({ error: 'Gemini API Key is missing or invalid in server environment.', requestId })}\n\n`,
      );
    } else {
      safeWrite(`data: ${JSON.stringify({ error: 'Stream failed', requestId })}\n\n`);
    }
  } finally {
    if (!res.writableEnded && !res.destroyed) res.end();
  }
});

export default router;
