/**
 * Transport Hub Component
 * Post-match departure options with AI recommendations, eco sorting, and navigation.
 * @module TransportHub
 */
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, TRANSPORT_ICONS } from '../utils/styles';
import { ECO_SCORE_THRESHOLDS } from '../utils/constants';
import { getCO2Color, getCapacityColor } from '../utils/helpers';
import { useAIInsight } from '../hooks/useAIInsight';

/**
 * @typedef {object} TransportOption
 * @property {string} id - Unique transport option ID
 * @property {string} type - Transport mode (e.g. 'Subway', 'Bus')
 * @property {string} line - Route/line name
 * @property {number} etaMinutes - Estimated departure time in minutes
 * @property {number} co2e - CO₂ emissions in g/km
 * @property {number} capacityLeft - Remaining seats
 * @property {boolean} recommended - Whether AI recommends this option
 * @property {string} [icon] - Material symbol icon name
 */

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
  const contextData = useStadiumContext((s) => s.contextData);
  const transportOptions = useStadiumContext((s) => s.contextData.transportOptions);
  const stadium = useStadiumContext((s) => s.contextData.stadium);
  const [sortBy, setSortBy] = useState('recommended');
  const [activeTab, setActiveTab] = useState('departure'); // 'departure' or 'arrival'
  const [sortAnnouncement, setSortAnnouncement] = useState('');
  const { insight: depRecommendation, requestInsight: requestDep } = useAIInsight(contextData);
  const { insight: arrivalRecommendation, requestInsight: requestArrival } =
    useAIInsight(contextData);

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

  const depFallback = `With ${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% capacity and match ending soon, expect heavy foot traffic. Take the ${bestEco?.type} (${bestEco?.line}) for the greenest option, or the ${fastest?.type} for speed.`;
  const arrivalFallback = `For smooth pre-match arrival at ${stadium.name || 'the stadium'}, park in Lot B (40% full) or take the Metro Line 4 directly to the North Gate. Avoid Interstate-30 due to road works.`;

  useEffect(() => {
    requestDep(
      `Give a concise transportation recommendation for fans departing ${stadium.name} to improve crowd management. Best eco option: ${bestEco?.type} (${bestEco?.co2e}g CO2). Fastest: ${fastest?.type} (${fastest?.etaMinutes}min). Occupancy: ${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}%. Keep to 2 sentences.`,
      depFallback,
    );
    requestArrival(
      `Give a concise transportation recommendation for fans arriving at ${stadium.name} to improve crowd management. State of parking: Lot A is 85% full, Lot B is 40% full, Lot C is closed. Suggest using Lot B or transit. Keep to 2 sentences.`,
      arrivalFallback,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Opens Google Maps navigation to the stadium with a deep-link.
   * Falls back to a generic maps search if coordinates are unavailable.
   * Coordinates and stadium name are sourced from contextData.stadium to avoid
   * hardcoding venue-specific values in the component.
   * @param {string} type - Transport mode label
   * @param {string} line - Route/line name
   */
  const handleNavigate = useCallback(
    (type, line) => {
      const lat = stadium.coordinates?.lat ?? 32.7479;
      const lng = stadium.coordinates?.lng ?? -97.0945;
      const stadiumLabel = stadium.name || 'Stadium';
      const STADIUM_NAME = encodeURIComponent(stadiumLabel);
      const destination = `${lat},${lng}`;
      const query = encodeURIComponent(`${type} ${line} to ${stadiumLabel}`);

      // Use Google Maps directions on mobile/desktop, falling back to query search
      const isMobile = window.matchMedia('(pointer:coarse)').matches;
      const url = isMobile
        ? `https://maps.google.com/?saddr=My+Location&daddr=${destination}&mode=transit`
        : `https://www.google.com/maps/dir/?api=1&destination=${STADIUM_NAME}&travelmode=transit&q=${query}`;

      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [stadium],
  );

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5" role="region" aria-label="Transport Hub">
      <div>
        <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
          Transport Hub
        </h2>
        <p className="text-sm" style={{ color: COLORS.outline }}>
          Pre-match arrival and post-match departure schedules for fans
        </p>
      </div>

      {/* Tab controls */}
      <div
        className="flex border-b"
        style={{ borderColor: COLORS.outlineVariant }}
        role="tablist"
        aria-label="Transport Options"
      >
        <button
          onClick={() => setActiveTab('departure')}
          className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer"
          style={{
            borderColor: activeTab === 'departure' ? COLORS.primary : 'transparent',
            color: activeTab === 'departure' ? COLORS.primary : COLORS.outline,
          }}
          aria-selected={activeTab === 'departure'}
          role="tab"
        >
          Post-Match Departure
        </button>
        <button
          onClick={() => setActiveTab('arrival')}
          className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer"
          style={{
            borderColor: activeTab === 'arrival' ? COLORS.primary : 'transparent',
            color: activeTab === 'arrival' ? COLORS.primary : COLORS.outline,
          }}
          aria-selected={activeTab === 'arrival'}
          role="tab"
        >
          Pre-Match Arrival & Parking
        </button>
      </div>

      {activeTab === 'departure' ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center animate-fade-in-up stagger-1">
              <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                {fastest.etaMinutes}m
              </div>
              <div className="text-xs mt-1" style={{ color: COLORS.outline }}>
                Fastest Option
              </div>
              <div
                className="text-xs font-medium mt-0.5"
                style={{ color: COLORS.onSurfaceVariant }}
              >
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
              <div
                className="text-xs font-medium mt-0.5"
                style={{ color: COLORS.onSurfaceVariant }}
              >
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
              <div
                className="text-xs font-medium mt-0.5"
                style={{ color: COLORS.onSurfaceVariant }}
              >
                across all modes
              </div>
            </div>
          </div>

          {/* AI Departure Tip — GenAI powered */}
          <div
            className="card p-4 animate-fade-in-up"
            style={{ background: COLORS.gradientNavy, border: 'none' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(245,200,66,0.2)',
                  border: '1px solid rgba(245,200,66,0.4)',
                }}
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
                  {depRecommendation || depFallback}
                </p>
              </div>
            </div>
          </div>

          {/* Smart Transit Broker Alert */}
          {transportOptions.filter((t) => t.status === 'delayed').length > 0 && (
            <div
              className="card p-4 animate-fade-in-up mt-2"
              style={{ background: COLORS.errorContainer, border: `1px solid ${COLORS.error}` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: COLORS.surface }}
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined"
                    style={{ color: COLORS.error, fontVariationSettings: "'FILL' 1" }}
                  >
                    transit_enterexit
                  </span>
                </div>
                <div className="flex-1">
                  <div
                    className="font-bold text-sm mb-1"
                    style={{ color: COLORS.onErrorContainer }}
                  >
                    Smart Transit Broker Alert
                  </div>
                  <ul
                    className="text-sm list-disc list-inside"
                    style={{ color: COLORS.onErrorContainer }}
                  >
                    {transportOptions
                      .filter((t) => t.status === 'delayed')
                      .map((t) => (
                        <li key={t.id}>
                          {t.type} {t.line}: {t.delayMessage}
                        </li>
                      ))}
                  </ul>
                  <p
                    className="text-sm font-semibold mt-2"
                    style={{ color: COLORS.onErrorContainer }}
                  >
                    AI Recommendation: Avoid delayed routes. Redirecting fans to {bestEco.type} and{' '}
                    {fastest.type}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Accessibility: Sort order announcer for screen readers */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
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
                      style={{
                        background: COLORS.gradientGold,
                        color: COLORS.onSecondaryContainer,
                      }}
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

                {t.status === 'delayed' && (
                  <div
                    className="mb-3 p-2 rounded text-xs font-bold border"
                    style={{
                      background: COLORS.errorContainer,
                      color: COLORS.onErrorContainer,
                      borderColor: COLORS.error,
                    }}
                  >
                    ⚠️ DELAYED: {t.delayMessage}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    className="p-2.5 rounded-xl text-center"
                    style={{ background: COLORS.surface }}
                  >
                    <div className="text-xl font-bold" style={{ color: COLORS.primary }}>
                      {t.etaMinutes}m
                    </div>
                    <div className="text-xs" style={{ color: COLORS.outline }}>
                      ETA
                    </div>
                  </div>
                  <div
                    className="p-2.5 rounded-xl text-center"
                    style={{ background: COLORS.surface }}
                  >
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
                    aria-label={`Get directions for ${t.type} (opens in new tab)`}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-sm">
                      directions
                    </span>
                    Navigate
                    <span className="sr-only">(opens in new tab)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* AI Pre-Match Arrival Recommendation */}
          <div
            className="card p-4 animate-fade-in-up"
            style={{ background: COLORS.gradientNavy, border: 'none' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(245,200,66,0.2)',
                  border: '1px solid rgba(245,200,66,0.4)',
                }}
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
                <div className="font-bold text-sm text-white mb-1">AI Arrival Recommendation</div>
                <p className="text-sm" style={{ color: 'rgba(168,202,255,0.9)' }}>
                  {arrivalRecommendation || arrivalFallback}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            {/* Real-time parking lot occupancy */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ color: COLORS.onSurface }}>
                Real-Time Parking Lot Occupancy
              </h3>
              <div className="flex flex-col gap-4">
                {[
                  {
                    name: 'Lot A (General Admission)',
                    pct: 85,
                    color: COLORS.error,
                    note: 'Heavy traffic',
                  },
                  {
                    name: 'Lot B (Pre-booked & Transit)',
                    pct: 40,
                    color: COLORS.success,
                    note: 'Recommended',
                  },
                  {
                    name: 'Lot C (FIFA Delegation)',
                    pct: 100,
                    color: COLORS.outline,
                    note: 'Closed to public',
                  },
                ].map((lot) => (
                  <div key={lot.name} className="flex flex-col">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span style={{ color: COLORS.onSurface }}>{lot.name}</span>
                      <span style={{ color: lot.color }}>
                        {lot.pct === 100 ? 'FULL' : `${lot.pct}%`}
                      </span>
                    </div>
                    <div className="density-bar mt-1" style={{ height: '8px' }}>
                      <div
                        className="density-fill"
                        style={{ width: `${lot.pct}%`, background: lot.color, borderRadius: '4px' }}
                      />
                    </div>
                    <span
                      className="text-[10px] mt-1 font-medium italic"
                      style={{ color: COLORS.outline }}
                    >
                      {lot.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingress Shuttle services */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ color: COLORS.onSurface }}>
                Park & Ride Shuttle Service (Ingress)
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  {
                    route: 'Blue Ingress Shuttle',
                    interval: 'Every 5 min',
                    eta: '3 min',
                    status: 'Running smoothly',
                  },
                  {
                    route: 'Red Ingress Shuttle',
                    interval: 'Every 10 min',
                    eta: '7 min',
                    status: 'Slight delay',
                  },
                  {
                    route: 'Green Express Transit',
                    interval: 'Every 15 min',
                    eta: '12 min',
                    status: 'Running smoothly',
                  },
                ].map((s) => (
                  <div
                    key={s.route}
                    className="flex justify-between items-center p-3 rounded-lg"
                    style={{ background: COLORS.surface }}
                  >
                    <div>
                      <div className="font-bold text-xs" style={{ color: COLORS.onSurface }}>
                        {s.route}
                      </div>
                      <div className="text-[10px]" style={{ color: COLORS.outline }}>
                        Frequency: {s.interval} · {s.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: COLORS.primary }}>
                        ETA {s.eta}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(TransportHub);
