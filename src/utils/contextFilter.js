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
