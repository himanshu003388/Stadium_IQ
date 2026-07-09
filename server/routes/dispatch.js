import { Router } from 'express';
import crypto from 'crypto';
import { authenticateApiKey, csrfProtection } from '../middleware/auth.js';
import { getGenAI, getBestAvailableModel } from '../utils/genai.js';

const router = Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/** Maximum number of volunteers accepted per dispatch request to cap Gemini prompt size */
const MAX_VOLUNTEERS = 50;
/** Maximum character length for task description field */
const MAX_TASK_DESC_LENGTH = 500;

function fallbackDispatch(task, volunteers) {
  const eligible = volunteers.filter(
    (v) =>
      v.languages.includes(task.requiredLanguage) &&
      v.skills.includes(task.requiredSkill) &&
      v.currentLoad < v.maxLoad &&
      v.status !== 'busy',
  );
  if (eligible.length === 0) return null;
  // Sort by load, then by zone match
  const best = eligible.toSorted((a, b) => {
    if (a.currentLoad !== b.currentLoad) return a.currentLoad - b.currentLoad;
    const aZoneMatch = a.zone === task.zone ? 0 : 1;
    const bZoneMatch = b.zone === task.zone ? 0 : 1;
    return aZoneMatch - bZoneMatch;
  })[0];
  return {
    volunteerId: best.id,
    reason: `${best.name} matches required skill (${task.requiredSkill}) and language, and has the lowest current operational load (${best.currentLoad}/${best.maxLoad}).`,
  };
}

router.post('/api/ai/volunteer-dispatch', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  const { task, volunteers } = req.body;

  if (!task || !Array.isArray(volunteers)) {
    return res
      .status(400)
      .json({ error: 'Task object and volunteers array are required.', requestId });
  }
  if (typeof task.description === 'string' && task.description.length > MAX_TASK_DESC_LENGTH) {
    return res.status(400).json({
      error: `Task description exceeds maximum length of ${MAX_TASK_DESC_LENGTH} characters.`,
      requestId,
    });
  }
  // Cap volunteers array to prevent Gemini prompt bloat
  const cappedVolunteers = volunteers.slice(0, MAX_VOLUNTEERS);

  try {
    const genAI = getGenAI();
    if (genAI && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
      const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: selectedModel });

      const prompt = `You are an AI Volunteer Dispatcher for the FIFA World Cup 2026 Smart Stadium operations center.
Your task is to assign the single best volunteer to handle the operational incident.

Incident details:
${JSON.stringify(task)}

List of available volunteers:
${JSON.stringify(cappedVolunteers)}

Choose the best volunteer. Output ONLY a valid JSON object with the volunteer's ID and a concise 1-sentence reason. Do not return any markdown markers or formatting, just the raw JSON text:
{
  "volunteerId": "string",
  "reason": "string"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const dispatchResult = JSON.parse(cleanText);
      return res.json({ suggestion: dispatchResult, requestId });
    }

    // Fallback
    const fallback = fallbackDispatch(task, cappedVolunteers);
    res.json({ suggestion: fallback, requestId, fallback: true });
  } catch (err) {
    console.error(`[${requestId}] AI Dispatch suggestion error:`, err);
    const fallback = fallbackDispatch(task, cappedVolunteers);
    res.json({ suggestion: fallback, requestId, fallback: true });
  }
});

export default router;
