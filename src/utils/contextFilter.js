export function buildSafeContext(rawCtx) {
  if (!rawCtx || typeof rawCtx !== 'object') return {};
  return {
    stadium: {
      name: rawCtx.stadium?.name,
      capacity: rawCtx.stadium?.capacity,
      currentOccupancy: rawCtx.stadium?.currentOccupancy,
      homeTeam: rawCtx.stadium?.homeTeam,
      awayTeam: rawCtx.stadium?.awayTeam,
      score: rawCtx.stadium?.score,
      matchPhase: rawCtx.stadium?.matchPhase,
      weather: rawCtx.stadium?.weather,
    },
    gates: Array.isArray(rawCtx.gates)
      ? rawCtx.gates.map((g) => ({
          id: g.id,
          direction: g.direction,
          density: g.density,
          waitTimeMinutes: g.waitTimeMinutes,
          status: g.status,
          accessible: g.accessible,
          accessibleFeatures: Array.isArray(g.accessibleFeatures) ? g.accessibleFeatures : [],
        }))
      : [],
    incidents: Array.isArray(rawCtx.incidents)
      ? rawCtx.incidents
          .filter((i) => i.status === 'active')
          .slice(0, 10)
          .map((i) => ({ id: i.id, type: i.type, severity: i.severity, location: i.location }))
      : [],
  };
}

/**
 * Slim context for crowd/navigation questions — only gate and stadium core.
 * @param {object} rawCtx
 */
export function buildCrowdContext(rawCtx) {
  if (!rawCtx || typeof rawCtx !== 'object') return {};
  return {
    stadium: {
      name: rawCtx.stadium?.name,
      currentOccupancy: rawCtx.stadium?.currentOccupancy,
      capacity: rawCtx.stadium?.capacity,
      matchPhase: rawCtx.stadium?.matchPhase,
    },
    gates: Array.isArray(rawCtx.gates)
      ? rawCtx.gates.map((g) => ({
          id: g.id,
          direction: g.direction,
          density: g.density,
          waitTimeMinutes: g.waitTimeMinutes,
          status: g.status,
        }))
      : [],
    incidents: Array.isArray(rawCtx.incidents)
      ? rawCtx.incidents
          .filter((i) => i.status === 'active')
          .slice(0, 5)
          .map((i) => ({ type: i.type, severity: i.severity, location: i.location }))
      : [],
  };
}

/**
 * Slim context for transport questions — excludes gates/incidents detail.
 * @param {object} rawCtx
 */
export function buildTransportContext(rawCtx) {
  if (!rawCtx || typeof rawCtx !== 'object') return {};
  return {
    stadium: {
      name: rawCtx.stadium?.name,
      currentOccupancy: rawCtx.stadium?.currentOccupancy,
      capacity: rawCtx.stadium?.capacity,
      matchPhase: rawCtx.stadium?.matchPhase,
    },
    transport: rawCtx.transport || [],
  };
}

/**
 * Slim context for sustainability questions — only sustainability metrics.
 * @param {object} rawCtx
 */
export function buildSustainabilityContext(rawCtx) {
  if (!rawCtx || typeof rawCtx !== 'object') return {};
  return {
    stadium: {
      name: rawCtx.stadium?.name,
    },
    sustainability: rawCtx.sustainability || {},
  };
}

/**
 * Slim context for accessibility questions — only gates with accessible features.
 * @param {object} rawCtx
 */
export function buildAccessibilityContext(rawCtx) {
  if (!rawCtx || typeof rawCtx !== 'object') return {};
  return {
    stadium: {
      name: rawCtx.stadium?.name,
      currentOccupancy: rawCtx.stadium?.currentOccupancy,
    },
    gates: Array.isArray(rawCtx.gates)
      ? rawCtx.gates
          .filter((g) => g.accessible)
          .map((g) => ({
            id: g.id,
            direction: g.direction,
            waitTimeMinutes: g.waitTimeMinutes,
            status: g.status,
            accessibleFeatures: Array.isArray(g.accessibleFeatures) ? g.accessibleFeatures : [],
          }))
      : [],
  };
}
