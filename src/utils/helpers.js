import { buildSafeContext } from './contextFilter';
export { buildSafeContext };

/**
 * Calculates a human-readable "time ago" string from a timestamp.
 * @param {string|number|Date} ts - The timestamp to calculate the difference from.
 * @returns {string} The formatted "time ago" string (e.g., '5m ago', 'just now').
 */
export function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 0) return 'just now';
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const DEMO_RESPONSE_TEMPLATES = {
  en: {
    accessible: (a) =>
      `♿ **Accessibility Services Available:**\n\n${a}\n\nNeed specific directions? Ask me about any accessibility service! ♿`,
    food: '🍔 **Nearby Food Options:**\n• North Stand: Pizza, hot dogs, nachos (Sections 112-130)\n• East Wing: Healthy wraps & salads (Section 215)\n• South Stand: Classic American burgers (Section 144)\n• West Wing: Vegetarian/vegan options (Section 308)',
    parking: (s) =>
      `🅿️ **Parking Availability:**\n• Lot C: ${Math.max(0, 240 - Math.floor(s.currentOccupancy / 250))} spots left — 12 min walk\n• Garage A: ${Math.max(0, 180 - Math.floor(s.currentOccupancy / 300))} spots left — 8 min walk\n• Lot D: ${Math.max(0, 300 - Math.floor(s.currentOccupancy / 200))} spots left — 15 min walk`,
    merch:
      "🛍️ **Official Merchandise Stands:**\n• Main Concourse: Jerseys, scarves, FIFA 2026 memorabilia\n• East Wing: Team-specific merchandise\n• West Wing: Eco-friendly apparel \n• Family Zone (North Stand): Kid's merchandise",
    transport: (t) =>
      `🚌 Best post-match option: **${t.type}** (${t.line}) — arrives in **${t.etaMinutes} minutes** with ${t.capacityLeft} spots. CO₂: only ${t.co2e}g/km — eco-friendly choice! 🌱`,
    weather: (w) =>
      `🌤️ Currently **${w?.temperature}°C** (feels like ${w?.feelsLike}°C), ${w?.conditions} skies with ${w?.humidity}% humidity. Stay hydrated — water stations are at every gate entrance!`,
    crowd: (s) =>
      `📊 Stadium is at **${Math.round((s.currentOccupancy / s.capacity) * 100)}% capacity** (${s.currentOccupancy?.toLocaleString()} fans). East Wing is the busiest zone. For comfort, try the **North Stand** area.`,
    eco: (sus) =>
      `♻️ Great question! Today we've saved **${sus?.co2SavedKg?.toLocaleString()}kg of CO₂** using ${sus?.renewablePercentage}% renewable energy. Waste diversion rate is ${sus?.wasteDiversionRate}%. Take public transit home to help us reach net zero! 🌍`,
    gate: (g) =>
      `🚪 The least congested gate right now is **Gate ${g.id}** (${g.direction} side) with only a **${g.waitTimeMinutes}-minute wait** and ${Math.round(g.density * 100)}% density. ${g.accessible ? '♿ It is wheelchair accessible.' : ''}`,
    default: (stadium) =>
      `🏟️ Welcome to **${stadium.name}**! Today's match: **${stadium.homeTeam} vs ${stadium.awayTeam}** (${stadium.score}, ${stadium.matchPhase}). How can I assist you? Ask about gates, transport, accessibility, weather, or crowd conditions!`,
  },
  es: {
    accessible: (a) =>
      `♿ **Servicios de Accesibilidad Disponibles:**\n\n${a}\n\n¿Necesitas indicaciones específicas? ¡Pregúntame!`,
    food: '🍔 **Opciones de Comida:**\n• Tribuna Norte: Pizza, perritos, nachos (Secciones 112-130)\n• Ala Este: Wraps saludables y ensaladas (Sección 215)\n• Tribuna Sur: Hamburguesas (Sección 144)\n• Ala Oeste: Opciones veganas/vegetarianas (Sección 308)',
    parking: (s) =>
      `🅿️ **Disponibilidad de Aparcamiento:**\n• Lote C: ${Math.max(0, 240 - Math.floor(s.currentOccupancy / 250))} plazas — 12 min a pie\n• Garaje A: ${Math.max(0, 180 - Math.floor(s.currentOccupancy / 300))} plazas — 8 min a pie`,
    merch:
      '🛍️ **Tiendas Oficiales:**\n• Concourse Principal: Camisetas, bufandas, recuerdos FIFA 2026\n• Ala Este: Merchandising por equipos\n• Ala Oeste: Ropa ecológica',
    default: (s) =>
      `🏟️ ¡Bienvenido a **${s.name}**! Partido de hoy: **${s.homeTeam} vs ${s.awayTeam}** (${s.score}, ${s.matchPhase}). ¿En qué puedo ayudarte? Pregunta sobre entradas, transporte, accesibilidad, clima o afluencia.`,
  },
  fr: {
    accessible: (a) =>
      `♿ **Services d'Accessibilité Disponibles :**\n\n${a}\n\nBesoin d'indications spécifiques ? Demandez-moi !`,
    food: '🍔 **Options Restauration :**\n• Tribune Nord : Pizza, hot-dogs, nachos (Sections 112-130)\n• Aile Est : Wraps sains et salades (Section 215)\n• Tribune Sud : Burgers classiques (Section 144)\n• Aile Ouest : Options végétaliens/végétariens (Section 308)',
    parking: (s) =>
      `🅿️ **Disponibilité Parking :**\n• Lot C : ${Math.max(0, 240 - Math.floor(s.currentOccupancy / 250))} places — 12 min à pied\n• Garage A : ${Math.max(0, 180 - Math.floor(s.currentOccupancy / 300))} places — 8 min à pied`,
    merch:
      '🛍️ **Boutiques Officielles :**\n• Concourse Principal : Maillots, écharpes, souvenirs FIFA 2026\n• Aile Est : Merchandising par équipe\n• Aile Ouest : Vêtements écologiques',
    default: (s) =>
      `🏟️ Bienvenue à **${s.name}** ! Match du jour : **${s.homeTeam} vs ${s.awayTeam}** (${s.score}, ${s.matchPhase}). Comment puis-je vous aider ? Renseignez-vous sur les portes, transports, accessibilité, météo ou affluence !`,
  },
  ar: {
    accessible: (a) =>
      `♿ **خدمات الإتاحة المتاحة:**\n\n${a}\n\nهل تحتاج إلى إرشادات محددة؟ اسألني!`,
    food: '🍔 **خيارات الطعام:**\n• المدرج الشمالي: بيتزا، هوت دوج، ناتشوز (الأقسام 112-130)\n• الجناح الشرقي: ملفوفات صحية وسلطات (القسم 215)\n• المدرج الجنوبي: برغر كلاسيكي (القسم 144)',
    parking: (s) =>
      `🅿️ **توفر مواقف السيارات:**\n• الموقف C: ${Math.max(0, 240 - Math.floor(s.currentOccupancy / 250))} مكان — 12 دقيقة سيراً\n• الكراج A: ${Math.max(0, 180 - Math.floor(s.currentOccupancy / 300))} مكان — 8 دقائق سيراً`,
    merch:
      '🛍️ **متاجر البضائع الرسمية:**\n• الردهة الرئيسية: قمصان، أوشحة، تذكارات كأس العالم 2026\n• الجناح الشرقي: بضائع خاصة بالفرق',
    default: (s) =>
      `🏟️ مرحباً بك في **${s.name}**! مباراة اليوم: **${s.homeTeam} مقابل ${s.awayTeam}** (${s.score}، ${s.matchPhase}). كيف يمكنني مساعدتك؟ اسأل عن البوابات أو المواصلات أو الإتاحة أو الطقس!`,
  },
  pt: {
    accessible: (a) =>
      `♿ **Serviços de Acessibilidade Disponíveis:**\n\n${a}\n\nPrecisa de direções específicas? Pergunte-me!`,
    food: '🍔 **Opções de Alimentação:**\n• Arquibancada Norte: Pizza, cachorro-quente, nachos (Seções 112-130)\n• Ala Leste: Wraps saudáveis e saladas (Seção 215)\n• Arquibancada Sul: Hambúrgueres (Seção 144)\n• Ala Oeste: Opções veganas/vegetarianas (Seção 308)',
    parking: (s) =>
      `🅿️ **Disponibilidade de Estacionamento:**\n• Lote C: ${Math.max(0, 240 - Math.floor(s.currentOccupancy / 250))} vagas — 12 min a pé\n• Garagem A: ${Math.max(0, 180 - Math.floor(s.currentOccupancy / 300))} vagas — 8 min a pé`,
    merch:
      '🛍️ **Lojas Oficiais:**\n• Concourse Principal: Camisas, cachecóis, souvenirs da Copa 2026\n• Ala Leste: Mercadoria por equipes\n• Ala Oeste: Roupas ecológicas',
    default: (s) =>
      `🏟️ Bem-vindo ao **${s.name}**! Jogo de hoje: **${s.homeTeam} vs ${s.awayTeam}** (${s.score}, ${s.matchPhase}). Como posso ajudá-lo? Pergunte sobre portões, transporte, acessibilidade, clima ou lotação!`,
  },
  ja: {
    accessible: (a) =>
      `♿ **ご利用可能なアクセシビリティサービス:**\n\n${a}\n\n具体的な案内が必要ですか？お気軽にお尋ねください!`,
    food: '🍔 **近くのフード情報:**\n• 北スタンド: ピザ、ホットドッグ、ナチョス (112-130番エリア)\n• 東ウィング: ヘルシーラップ・サラダ (215番)\n• 南スタンド: バーガー (144番)\n• 西ウィング: ヴィーガン・ベジタリアン (308番)',
    parking: (s) =>
      `🅿️ **駐車場空き状況:**\n• Cロット: ${Math.max(0, 240 - Math.floor(s.currentOccupancy / 250))}台 — 徒歩12分\n• Aガレージ: ${Math.max(0, 180 - Math.floor(s.currentOccupancy / 300))}台 — 徒歩8分`,
    merch:
      '🛍️ **公式グッズ売場:**\n• メインコンコース: ユニフォーム、マフラー、FIFA 2026記念品\n• 東ウィング: チーム別グッズ\n• 西ウィング: エコ素材アパレル',
    default: (s) =>
      `🏟️ **${s.name}**へようこそ！本日の試合: **${s.homeTeam} vs ${s.awayTeam}** (${s.score}、${s.matchPhase})。ゲート・交通・バリアフリー・天気・混雑状況などお気軽にご質問ください！`,
  },
  hi: {
    accessible: (a) =>
      `♿ **उपलब्ध एक्सेसिबिलिटी सेवाएँ:**\n\n${a}\n\nविशेष निर्देश चाहिए? मुझसे पूछें!`,
    food: '🍔 **पास के खाने के विकल्प:**\n• उत्तरी स्टैंड: पिज़्ज़ा, हॉट डॉग, नाचोस (सेक्शन 112-130)\n• पूर्वी विंग: हेल्दी रैप्स और सलाद (सेक्शन 215)\n• दक्षिणी स्टैंड: बर्गर (सेक्शन 144)\n• पश्चिमी विंग: वेगन/शाकाहारी विकल्प (सेक्शन 308)',
    parking: (s) =>
      `🅿️ **पार्किंग उपलब्धता:**\n• लॉट C: ${Math.max(0, 240 - Math.floor(s.currentOccupancy / 250))} जगहें — 12 मिनट पैदल\n• गैरेज A: ${Math.max(0, 180 - Math.floor(s.currentOccupancy / 300))} जगहें — 8 मिनट पैदल`,
    merch:
      '🛍️ **आधिकारिक मर्चेंडाइज़ स्टॉल्स:**\n• मुख्य कॉनकोर्स: जर्सी, स्कार्फ, FIFA 2026 स्मृति चिह्न\n• पूर्वी विंग: टीम-विशेष मर्चेंडाइज़\n• पश्चिमी विंग: इको-फ्रेंडली परिधान',
    default: (s) =>
      `🏟️ **${s.name}** में आपका स्वागत है! आज का मैच: **${s.homeTeam} बनाम ${s.awayTeam}** (${s.score}, ${s.matchPhase})। मैं आपकी कैसे मदद कर सकता हूँ? गेट, परिवहन, एक्सेसिबिलिटी, मौसम, या भीड़ के बारे में पूछें!`,
  },
};

const COMPILED_KEYWORDS = {};
function getMatcherRegex(keyword) {
  if (!COMPILED_KEYWORDS[keyword]) {
    COMPILED_KEYWORDS[keyword] = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i',
    );
  }
  return COMPILED_KEYWORDS[keyword];
}

const MATCHER_CONFIGS = [
  {
    keys: [
      'accessible',
      'wheelchair',
      'disability',
      'handicap',
      'hearing',
      'blind',
      'service animal',
      'sign language',
      'braille',
      'mobility',
      'deaf',
      'visual',
    ],
    res: 'accessible',
  },
  { keys: ['restaurant', 'food', 'eat', 'snack', 'meal', 'drink'], res: 'food' },
  { keys: ['parking', 'car', 'vehicle', 'garage', 'lot'], res: 'parking' },
  { keys: ['merch', 'shop', 'store', 'jersey', 'souvenir', 'apparel'], res: 'merch' },
  {
    keys: ['transport', 'metro', 'bus', 'subway', 'train', 'depart', 'shuttle', 'rideshare'],
    res: 'transport',
  },
  { keys: ['temperature', 'weather', 'rain', 'hot', 'cold', 'humidity'], res: 'weather' },
  { keys: ['eco', 'green', 'sustain', 'carbon', 'environment', 'renewable'], res: 'eco' },
  { keys: ['crowd', 'busy', 'full', 'capacity', 'density'], res: 'crowd' },
  { keys: ['gate', 'entrance', 'door', 'enter', 'entry'], res: 'gate' },
];

const MATCHERS = MATCHER_CONFIGS.map((cfg) => ({
  regexps: cfg.keys.map(getMatcherRegex),
  res: cfg.res,
  getResponse: (langRes) => langRes[cfg.res],
}));

function getAccessibilityInfo(services) {
  return (services || [])
    .map(
      (s) =>
        `• **${s.type}**: ${(Array.isArray(s.locations) ? s.locations : []).join(', ')} — ${s.description || ''}`,
    )
    .join('\n');
}

/**
 * Generates an offline/demo GenAI response when the API is unavailable.
 * @param {string} text - The user query to parse.
 * @param {Object} ctx - The current stadium context (gates, incidents, etc.).
 * @param {string} [language='en'] - The requested ISO language code.
 * @returns {string} The mock translated or contextualized response.
 */
export function getDemoResponse(text, ctx, language = 'en') {
  const { gates = [], transportOptions = [], stadium = {}, accessibilityServices = [] } = ctx || {};
  const lowerText = text.toLowerCase();
  const langTemplates = DEMO_RESPONSE_TEMPLATES[language] || DEMO_RESPONSE_TEMPLATES.en;
  const bestGate = [...gates].sort((a, b) => a.density - b.density)[0] || {};
  const bestTransport = transportOptions.find((t) => t.recommended) || transportOptions[0] || {};
  const accessibilityInfo = getAccessibilityInfo(accessibilityServices);

  for (const matcher of MATCHERS) {
    for (const regex of matcher.regexps) {
      if (regex.test(lowerText)) {
        const template =
          typeof langTemplates[matcher.res] === 'function' ? langTemplates[matcher.res] : null;
        if (template) {
          switch (matcher.res) {
            case 'gate':
              return template(bestGate);
            case 'transport':
              return template(bestTransport);
            case 'weather':
              return template(stadium.weather);
            case 'crowd':
              return template(stadium);
            case 'eco':
              return template(stadium.sustainability);
            case 'parking':
              return template(stadium);
            case 'accessible':
              return template(accessibilityInfo);
            default:
              return template();
          }
        }
        return langTemplates[matcher.res] || langTemplates.default(stadium);
      }
    }
  }
  return langTemplates.default(stadium);
}

/**
 * Safely parses and renders simple Markdown text into HTML strings.
 * Used primarily for formatting Gemini chat responses.
 * @param {string} text - The raw Markdown text.
 * @returns {string} The parsed HTML output.
 */
export function renderMarkdown(text) {
  let result = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/^• (.+)$/gm, '<li>$1</li>');
  result = result.replace(
    /(<li>.*<\/li>\n?)+/gs,
    (match) => `<ul style="margin: 6px 0; padding-left: 16px;">${match}</ul>`,
  );
  result = result.replace(/\n/g, '<br/>');
  result = result.replace(/<\/li><br\/>/g, '</li>');
  result = result.replace(/<br\/><\/ul>/g, '</ul>');
  return result;
}

export function getLoadBarColor(current, max) {
  const pct = Math.round((current / max) * 100);
  if (pct >= 100) return 'var(--color-status-critical)';
  if (pct >= 60) return 'var(--color-status-busy)';
  return 'var(--color-status-nominal)';
}

export function getDensityColor(density) {
  if (density > 0.85) return 'var(--color-status-critical)';
  if (density > 0.65) return 'var(--color-status-busy)';
  return 'var(--color-status-nominal)';
}

export function getStatusColor(status) {
  if (status === 'critical') return 'var(--color-status-critical)';
  if (status === 'watch') return 'var(--color-status-busy)';
  return 'var(--color-status-nominal)';
}

export function getCO2Color(co2e) {
  if (co2e === 0) return 'var(--color-success)';
  if (co2e <= 10) return 'var(--color-tertiary)';
  if (co2e <= 20) return 'var(--color-secondary-container)';
  if (co2e <= 40) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function getSeverityColor(severity) {
  if (severity === 'critical') return 'var(--color-error)';
  if (severity === 'medium') return 'var(--color-warning)';
  return 'var(--color-info)';
}

export function getCapacityColor(seatsLeft) {
  if (seatsLeft <= 5) return 'var(--color-error)';
  if (seatsLeft <= 20) return 'var(--color-warning)';
  return 'var(--color-success)';
}
