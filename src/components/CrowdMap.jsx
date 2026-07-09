import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, ZONE_COLORS } from '../utils/styles';
import { useAIInsight } from '../hooks/useAIInsight';
import StadiumSVG from './crowd-map/StadiumSVG';
import GatePanel from './crowd-map/GatePanel';
import IndoorNavigation from './crowd-map/IndoorNavigation';

function CrowdMap() {
  const contextData = useStadiumContext((s) => s.contextData);
  const gates = useStadiumContext((s) => s.contextData.gates);
  const stadium = useStadiumContext((s) => s.contextData.stadium);
  const [selectedZone, setSelectedZone] = useState();
  const [activeIndoorGate, setActiveIndoorGate] = useState(null);
  const { insight: aiNavTip, requestInsight: requestNavTip } = useAIInsight(contextData);

  const handleZoneClick = useCallback((zone) => {
    setSelectedZone((prev) => (prev === zone.id ? undefined : zone.id));
  }, []);

  const handleToggleIndoorNav = useCallback((gateId) => {
    setActiveIndoorGate((prev) => (prev === gateId ? null : gateId));
  }, []);

  const selectedZoneData = selectedZone
    ? stadium.zones.find((z) => z.id === selectedZone)
    : undefined;
  const bestGate = useMemo(() => gates.toSorted((a, b) => a.density - b.density)[0], [gates]);
  const worstZone = useMemo(
    () => stadium.zones.toSorted((a, b) => b.occupancy - a.occupancy)[0],
    [stadium.zones],
  );

  const navTipFallback = `Use Gate ${bestGate?.id || 'A'} for fastest entry — only ${bestGate?.waitTimeMinutes || 5} min wait. ${worstZone?.name || 'Unknown'} is at ${Math.round((worstZone?.occupancy || 0) * 100)}% capacity.`;
  useEffect(() => {
    requestNavTip(
      `Give a concise navigation and crowd management tip for fans at ${stadium.name}. Current best gate: ${bestGate?.id}, wait time: ${bestGate?.waitTimeMinutes}min. Busiest zone: ${worstZone?.name} at ${Math.round((worstZone?.occupancy || 0) * 100)}% capacity. Current score: ${stadium.score}. Keep it to 2 sentences.`,
      navTipFallback,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="p-4 md:p-6 flex flex-col gap-5"
      role="region"
      aria-label="Crowd and navigation map"
    >
      <div>
        <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
          Crowd & Navigation
        </h2>
        <p className="text-sm" style={{ color: COLORS.outline }}>
          Live stadium map · Use arrow keys to navigate zones, Enter to select
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          className="lg:col-span-2 card p-5 animate-fade-in-up"
          role="group"
          aria-label="Interactive stadium map"
        >
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              {stadium.name}
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: COLORS.error }}
              />
              <span className="text-xs font-medium" style={{ color: COLORS.error }}>
                Live
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-3 flex-wrap mb-3"
            role="list"
            aria-label="Zone status legend"
          >
            {Object.entries(ZONE_COLORS).map(([key, c]) => (
              <div key={key} className="flex items-center gap-1.5" role="listitem">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: c.fill }}
                  aria-hidden="true"
                />
                <span className="text-xs" style={{ color: COLORS.onSurfaceVariant }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          <StadiumSVG
            zones={stadium.zones}
            gates={gates}
            onZoneClick={handleZoneClick}
            selectedZone={selectedZone}
          />

          {selectedZoneData && (
            <div
              className="mt-4 p-4 rounded-xl animate-fade-in-up"
              role="region"
              aria-label={`${selectedZoneData.name} details`}
              style={{
                background: (ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).bg,
                border: `1.5px solid ${(ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).fill}40`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="font-bold text-sm"
                  style={{
                    color: (ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).text,
                  }}
                >
                  {selectedZoneData.name}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: (ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).fill,
                    color: 'white',
                  }}
                >
                  {(ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div
                    className="text-xl font-bold"
                    style={{
                      color: (ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).text,
                    }}
                  >
                    {Math.round(selectedZoneData.occupancy * 100)}%
                  </div>
                  <div className="text-xs" style={{ color: COLORS.outline }}>
                    Occupancy
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: COLORS.onSurface }}>
                    {(selectedZoneData.capacity * selectedZoneData.occupancy).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 },
                    )}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.outline }}>
                    Fans
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: COLORS.onSurface }}>
                    {((1 - selectedZoneData.occupancy) * selectedZoneData.capacity).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 },
                    )}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.outline }}>
                    Available
                  </div>
                </div>
              </div>
              {selectedZoneData.status === 'critical' && (
                <div
                  className="mt-2 flex items-center gap-2 text-xs"
                  role="alert"
                  style={{ color: COLORS.error }}
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    warning
                  </span>
                  Crowd control deployed. Avoid this zone if possible.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <GatePanel
            gates={gates}
            activeIndoorGate={activeIndoorGate}
            onToggleIndoorNav={handleToggleIndoorNav}
          />

          {activeIndoorGate && (
            <IndoorNavigation gateId={activeIndoorGate} onClose={() => setActiveIndoorGate(null)} />
          )}

          <div
            className="card p-4 animate-fade-in-up stagger-2"
            style={{ background: COLORS.gradientNavy, border: 'none' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}
              >
                smart_toy
              </span>
              <span className="text-white font-bold text-sm">AI Navigation Tip</span>
            </div>
            <div className="text-sm" style={{ color: 'rgba(168,202,255,0.9)' }}>
              {aiNavTip || navTipFallback}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CrowdMap);
