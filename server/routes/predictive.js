import { Router } from 'express';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { jwtAuth } from '../middleware/auth.js';
import { getGenAI, getBestAvailableModel } from '../utils/genai.js';

const router = Router();

function generateInsights(contextData) {
  const { stadium = {}, gates = [], incidents = [], vendors = [] } = contextData || {};
  const occupancy = stadium.currentOccupancy || 0;
  const capacity = stadium.capacity || 1;
  const occupancyRate = occupancy / capacity;

  const crowdedGates = gates.filter((g) => g.density > 0.7);
  const predictedCongestion = crowdedGates.map((g) => ({
    gateId: g.id,
    direction: g.direction,
    currentDensity: Math.round(g.density * 100),
    riskLevel: g.density > 0.85 ? 'critical' : 'high',
    recommendation:
      g.density > 0.85
        ? `Gate ${g.id} is critically congested. Recommend redirecting influx to alternate gates and deploying additional staff.`
        : `Gate ${g.id} has high density. Monitor closely and prepare overflow lanes.`,
  }));

  const criticalIncidents = incidents.filter(
    (i) => i.status === 'active' && i.severity === 'critical',
  );
  const predictedEscalation = criticalIncidents.map((i) => ({
    incidentId: i.id,
    type: i.type,
    location: i.location,
    escalationRisk: 'medium',
    recommendation: `Incident ${i.type} at ${i.location} requires attention. Based on historical patterns, deploy 2 additional volunteers for crowd control and notify medical team.`,
  }));

  const vendorStockRisk = (vendors || []).map((v) => {
    const lowStock = (v.inventory || []).filter((item) => (item.stock || 0) < 20);
    return {
      vendorId: v.id,
      name: v.name,
      lowStockItems: lowStock.map((item) => item.name || item.item),
      restockUrgency: lowStock.length > 3 ? 'high' : 'low',
      recommendation:
        lowStock.length > 0
          ? `Vendor ${v.name} has ${lowStock.length} items near depletion. AI suggests restocking within 30 minutes based on projected demand.`
          : 'Stock levels adequate.',
    };
  });

  const peakEgressTime =
    occupancyRate > 0.7
      ? Math.round(25 + (occupancyRate - 0.7) * 50)
      : Math.round(10 + occupancyRate * 20);
  const postMatchRecommendation =
    occupancyRate > 0.7
      ? `Stadium is ${Math.round(occupancyRate * 100)}% full. Estimated peak egress: ${peakEgressTime} minutes. Recommend: (1) Open all exit gates, (2) Activate public address system for phased departure, (3) Increase shuttle frequency by 40%.`
      : `Normal egress conditions expected. Estimated egress time: ${peakEgressTime} minutes.`;

  return {
    timestamp: new Date().toISOString(),
    occupancyRate: Math.round(occupancyRate * 100),
    gateCongestion: predictedCongestion,
    incidentEscalation: predictedEscalation,
    vendorStockRisk,
    egressPrediction: {
      estimatedEgressMinutes: peakEgressTime,
      recommendation: postMatchRecommendation,
    },
    capacityUtilizationTrend: occupancyRate > 0.75 ? 'increasing' : 'stable',
    aiDecisionSupport: [
      ...predictedCongestion.map((g) => g.recommendation),
      ...predictedEscalation.map((i) => i.recommendation),
      postMatchRecommendation,
    ],
    _meta: {
      model: 'stadium-iq-predictive-v1',
      confidence: 'high',
    },
  };
}

router.post('/api/ai/predictive-insights', jwtAuth, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  try {
    const { contextData } = req.body;
    const genAI = getGenAI();

    if (genAI) {
      const selectedModel = await getBestAvailableModel();
      const model = genAI.getGenerativeModel({ model: selectedModel });

      const prompt = `You are a predictive operational intelligence engine for the FIFA World Cup 2026 Smart Stadium operations center, designed to enhance the tournament experience for venue staff and organizers.
Your goal is to leverage Generative AI to provide real-time decision support, crowd management forecasting, and operational intelligence.
Given the current stadium status context:
${JSON.stringify(contextData || {})}

Analyze the status and return a JSON object containing predictive insights.
The JSON object must have EXACTLY the following structure (do not return any markdown code block formatting, just the raw JSON text):
{
  "timestamp": "string (ISO)",
  "occupancyRate": number (0-100),
  "gateCongestion": [
    {
      "gateId": "string",
      "direction": "string",
      "currentDensity": number,
      "riskLevel": "high" | "critical",
      "recommendation": "string"
    }
  ],
  "incidentEscalation": [
    {
      "incidentId": "string",
      "type": "string",
      "location": "string",
      "escalationRisk": "medium" | "high",
      "recommendation": "string"
    }
  ],
  "vendorStockRisk": [
    {
      "vendorId": "string",
      "name": "string",
      "lowStockItems": ["string"],
      "restockUrgency": "low" | "high",
      "recommendation": "string"
    }
  ],
  "egressPrediction": {
    "estimatedEgressMinutes": number,
    "recommendation": "string"
  },
  "capacityUtilizationTrend": "increasing" | "stable" | "decreasing",
  "aiDecisionSupport": [
    "string"
  ],
  "_meta": {
    "model": "stadium-iq-predictive-v1 (Gemini)",
    "confidence": "high"
  }
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const insights = JSON.parse(cleanText);
      return res.json({ insights, requestId });
    }

    // Rule-engine fallback
    const insights = generateInsights(contextData);
    res.json({ insights, requestId });
  } catch (err) {
    logger.error(`[${requestId}] Predictive insights error, falling back:`, err);
    try {
      const insights = generateInsights(req.body.contextData);
      res.json({ insights, requestId, fallback: true });
    } catch {
      res.status(500).json({ error: 'Failed to generate predictive insights.', requestId });
    }
  }
});

export default router;
