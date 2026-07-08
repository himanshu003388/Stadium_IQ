import React, { useState, useMemo, useCallback, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, TRANSPORT_ICONS } from '../utils/styles';
import { ECO_SCORE_THRESHOLDS } from '../utils/constants';
import { getCO2Color, getCapacityColor } from '../utils/helpers';

/**
 * Eco score badge based on CO₂ emissions.
 * @param {{ co2e: number }} props
 */
const EcoScore = memo(function EcoScore({ co2e }) {
  if (co2e === ECO_SCORE_THRESHOLDS.zero)
    return <span className="badge-success">Zero Emission</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.low) return <span className="badge-success">Eco ♻️</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.moderate) return <span className="badge-info">Low CO₂</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.high) return <span className="badge-warning">Moderate</span>;
  return <span className="badge-critical">High CO₂</span>;
});

/**
 * CO₂ impact bar with color-coded fill.
 * @param {{ co2e: number, maxCo2?: number }} props
 */
const CO2Bar = memo(function CO2Bar({ co2e, maxCo2 = 50 }) {
  const pct = Math.min((co2e / maxCo2) * 100, 100);
  const color = getCO2Color(co2e);
  return (
    <div
      className="density-bar"
      style={{ height: '5px' }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`CO₂ impact at ${Math.round(pct)}%`}
    >
      <div className="density-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
});

/**
 * Capacity indicator showing remaining seats with color coding.
 * @param {{ left: number }} props
 */
const CapacityIndicator = memo(function CapacityIndicator({ left }) {
  const color = getCapacityColor(left);
  return (
    <span
      className="text-xs font-medium"
      style={{ color }}
      role="status"
      aria-live="polite"
      aria-label={`${left} seats left`}
    >
      {left <= 5 ? '⚠️' : '✓'} {left} seats left
    </span>
  );
});

/**
 * Transport Hub panel — post-match departure options with sorting and eco insights.
 */
function TransportHub() {
  const { contextData } = useStadiumContext();
  const { transportOptions, stadium } = contextData;
  const [sortBy, setSortBy] = useState('recommended');
  const [sortAnnouncement, setSortAnnouncement] = useState('');

  const handleSortChange = useCallback((key, label) => {
    setSortBy(key);
    setSortAnnouncement(`Transport options sorted by ${label}`);
  }, []);

  const sorted = useMemo(
    () =>
      transportOptions.toSorted((a, b) => {
        if (sortBy === 'recommended') return (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0);
        if (sortBy === 'eta') return a.etaMinutes - b.etaMinutes;
        if (sortBy === 'eco') return a.co2e - b.co2e;
        if (sortBy === 'capacity') return b.capacityLeft - a.capacityLeft;
        return 0;
      }),
    [transportOptions, sortBy],
  );

  const bestEco = useMemo(
    () => transportOptions.toSorted((a, b) => a.co2e - b.co2e)[0],
    [transportOptions],
  );
  const fastest = useMemo(
    () => transportOptions.toSorted((a, b) => a.etaMinutes - b.etaMinutes)[0],
    [transportOptions],
  );

  const handleNavigate = useCallback((_type, _line) => {
    // Placeholder for directions/navigation functionality
    // In production, this would open maps or provide turn-by-turn directions
  }, []);

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5" role="region" aria-label="Transport Hub">
      <div>
        <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
          Transport Hub
        </h2>
        <p className="text-sm" style={{ color: COLORS.outline }}>
          Post-match departure options · Real-time availability
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center animate-fade-in-up stagger-1">
          <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            {fastest.etaMinutes}m
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.outline }}>
            Fastest Option
          </div>
          <div className="text-xs font-medium mt-0.5" style={{ color: COLORS.onSurfaceVariant }}>
            {fastest.type}
          </div>
        </div>
        <div className="card p-4 text-center animate-fade-in-up stagger-2">
          <div className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {bestEco.co2e}g
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.outline }}>
            Lowest CO₂/km
          </div>
          <div className="text-xs font-medium mt-0.5" style={{ color: COLORS.onSurfaceVariant }}>
            {bestEco.type}
          </div>
        </div>
        <div className="card p-4 text-center animate-fade-in-up stagger-3">
          <div className="text-2xl font-bold" style={{ color: COLORS.secondary }}>
            {transportOptions.reduce((s, t) => s + t.capacityLeft, 0).toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.outline }}>
            Total Seats Left
          </div>
          <div className="text-xs font-medium mt-0.5" style={{ color: COLORS.onSurfaceVariant }}>
            across all modes
          </div>
        </div>
      </div>

      {/* AI Departure Tip */}
      <div
        className="card p-4 animate-fade-in-up"
        style={{ background: COLORS.gradientNavy, border: 'none' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,200,66,0.2)', border: '1px solid rgba(245,200,66,0.4)' }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ color: COLORS.secondaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              smart_toy
            </span>
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-white mb-1">AI Departure Recommendation</div>
            <p className="text-sm" style={{ color: 'rgba(168,202,255,0.9)' }}>
              With {Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% capacity and
              match ending soon, expect heavy foot traffic.{' '}
              <strong className="text-white">Take the {bestEco.type}</strong> ({bestEco.line}) for
              the greenest option, or the <strong className="text-white">{fastest.type}</strong> for
              speed. Departure crowds will peak in approximately{' '}
              <strong className="text-white">25 minutes</strong> — consider leaving early or staying
              for post-match events.
            </p>
          </div>
        </div>
      </div>

      {/* Accessibility: Sort order announcer for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {sortAnnouncement}
      </div>

      {/* Sort Controls */}
      <div
        className="flex items-center gap-2 flex-wrap"
        role="radiogroup"
        aria-label="Sort transport options"
      >
        <span className="text-xs font-medium" style={{ color: COLORS.outline }}>
          Sort by:
        </span>
        {[
          { key: 'recommended', label: 'AI Recommended' },
          { key: 'eta', label: 'Fastest' },
          { key: 'eco', label: 'Most Eco' },
          { key: 'capacity', label: 'Most Seats' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => handleSortChange(s.key, s.label)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            role="radio"
            aria-checked={sortBy === s.key}
            aria-label={`Sort by ${s.label}`}
            style={{
              background: sortBy === s.key ? COLORS.primary : COLORS.surface,
              color: sortBy === s.key ? COLORS.onPrimary : COLORS.onSurfaceVariant,
              border: `1px solid ${sortBy === s.key ? COLORS.primary : COLORS.outlineVariant}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Transport Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        role="list"
        aria-label="Transport options"
      >
        {sorted.map((t, i) => (
          <div
            key={t.id}
            className={`card p-5 animate-fade-in-up stagger-${i + 1} relative overflow-hidden`}
            role="listitem"
          >
            {t.recommended && (
              <div className="absolute top-3 right-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: COLORS.gradientGold, color: COLORS.onSecondaryContainer }}
                >
                  ⭐ Recommended
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: COLORS.surface }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-2xl"
                  style={{ color: COLORS.primary, fontVariationSettings: "'FILL' 1" }}
                >
                  {TRANSPORT_ICONS[t.icon] || t.icon}
                </span>
              </div>
              <div>
                <div className="font-bold text-base" style={{ color: COLORS.onSurface }}>
                  {t.type}
                </div>
                <div className="text-xs" style={{ color: COLORS.outline }}>
                  {t.line}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2.5 rounded-xl text-center" style={{ background: COLORS.surface }}>
                <div className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {t.etaMinutes}m
                </div>
                <div className="text-xs" style={{ color: COLORS.outline }}>
                  ETA
                </div>
              </div>
              <div className="p-2.5 rounded-xl text-center" style={{ background: COLORS.surface }}>
                <div
                  className="text-xl font-bold"
                  style={{ color: t.co2e === 0 ? COLORS.success : COLORS.onSurfaceVariant }}
                >
                  {t.co2e}
                  <span className="text-xs font-normal">g</span>
                </div>
                <div className="text-xs" style={{ color: COLORS.outline }}>
                  CO₂/km
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: COLORS.outline }}>CO₂ Impact</span>
                <EcoScore co2e={t.co2e} />
              </div>
              <CO2Bar co2e={t.co2e} />
            </div>

            <div className="flex items-center justify-between">
              <CapacityIndicator left={t.capacityLeft} />
              <button
                onClick={() => handleNavigate(t.type, t.line)}
                className="btn-primary text-xs py-1.5 px-3"
                aria-label={`Get directions for ${t.type}`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-sm">
                  directions
                </span>
                Navigate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(TransportHub);
