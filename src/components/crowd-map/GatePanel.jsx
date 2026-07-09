import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS, GATE_STATUS_COLORS } from '../../utils/styles';

function GatePanel({ gates, activeIndoorGate, onToggleIndoorNav }) {
  return (
    <div
      className="card p-4 animate-fade-in-up stagger-1"
      role="region"
      aria-label="Gate status panel"
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          aria-hidden="true"
          className="material-symbols-outlined"
          style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
        >
          sensor_door
        </span>
        <h3 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
          Gate Status
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {gates.map((gate) => {
          const gateColorConfig = GATE_STATUS_COLORS[gate.status] || GATE_STATUS_COLORS.normal;
          const bgColor = gateColorConfig.bg;
          const textColor = gateColorConfig.text;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('AT&T Stadium, Arlington, TX')}&travelmode=walking&q=${encodeURIComponent(`Gate ${gate.id}`)}`;
          return (
            <div
              key={gate.id}
              className="flex items-center gap-2 p-2.5 rounded-xl"
              style={{ background: `${bgColor}33`, border: `1px solid ${textColor}30` }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: textColor }}
              >
                {gate.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-medium" style={{ color: COLORS.onSurface }}>
                    {gate.direction} — {gate.waitTimeMinutes}m wait
                  </span>
                  <span className="font-mono font-bold" style={{ color: textColor }}>
                    {Math.round(gate.density * 100)}%
                  </span>
                </div>
                <div className="density-bar" style={{ height: '4px' }}>
                  <div
                    className="density-fill"
                    style={{ width: `${gate.density * 100}%`, background: textColor }}
                  />
                </div>
              </div>
              {gate.accessible && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-sm shrink-0"
                  style={{ color: COLORS.info, fontVariationSettings: "'FILL' 1" }}
                  title="Wheelchair accessible"
                >
                  accessible
                </span>
              )}
              {gate.accessibleFeatures?.includes('hearing-loop') && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-sm shrink-0"
                  style={{ color: COLORS.secondary, fontVariationSettings: "'FILL' 1" }}
                  title="Hearing loop available"
                >
                  hearing
                </span>
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Navigate to Gate ${gate.id} via Google Maps (opens in a new tab)`}
                title={`Navigate to Gate ${gate.id} (opens in new tab)`}
                className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md"
                style={{ background: `${COLORS.primary}22`, color: COLORS.primary }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined"
                  style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}
                >
                  directions
                </span>
              </a>
              <button
                onClick={() => onToggleIndoorNav(gate.id)}
                aria-label={`Show indoor wayfinding for Gate ${gate.id}`}
                title={`Indoor wayfinding for Gate ${gate.id}`}
                className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors"
                style={{
                  background:
                    activeIndoorGate === gate.id
                      ? COLORS.secondaryContainer
                      : `${COLORS.secondary}22`,
                  color:
                    activeIndoorGate === gate.id ? COLORS.onSecondaryContainer : COLORS.secondary,
                }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined"
                  style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}
                >
                  explore
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

GatePanel.propTypes = {
  gates: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeIndoorGate: PropTypes.string,
  onToggleIndoorNav: PropTypes.func.isRequired,
};

export default memo(GatePanel);
