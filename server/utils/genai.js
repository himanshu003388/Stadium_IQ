import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAIInstance = null;

export function getGenAI() {
  if (!genAIInstance && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
    genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAIInstance;
}

let cachedModelName = null;

export async function getBestAvailableModel(apiKey) {
  if (cachedModelName) return cachedModelName;
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': apiKey },
    });
    if (!res.ok) return 'gemini-1.5-flash';
    const data = await res.json();
    const flashModels = data.models
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash'),
      )
      .map((m) => m.name.replace('models/', ''));
    const preferred =
      flashModels.find((m) => m.includes('2.5')) ||
      flashModels.find((m) => m.includes('2.0')) ||
      flashModels[0] ||
      'gemini-1.5-flash';
    cachedModelName = preferred;
    console.log(`[Auto-Select] Dynamically selected model: ${cachedModelName}`);
    return cachedModelName;
  } catch (err) {
    console.error('Failed to dynamically fetch models, using fallback', err);
    return 'gemini-1.5-flash';
  }
}

export function buildSystemPrompt(safeContext, language) {
  return `You are the AI Assistant for the FIFA World Cup 2026 Smart Stadiums operations center.
Your goal is to help staff and fans with real-time stadium operations, navigation, and volunteer dispatching.
CRITICAL: You are fully trained on VIP / FIFA Delegation Routing protocols and security procedures.
Keep responses concise, actionable, and professional. Use formatting like bullet points where appropriate.
If the language requested is not English, respond in that language. Requested language code: ${language || 'en'}.

Current Stadium Context:
${safeContext}`;
}
