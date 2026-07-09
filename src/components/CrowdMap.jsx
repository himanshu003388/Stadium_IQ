/**
 * Crowd & Navigation Map Component
 * Interactive SVG stadium map with keyboard navigation and gate wayfinding.
 * @component
 *
 * @typedef {object} Zone
 * @property {string} id - Zone identifier (north/south/east/west)
 * @property {string} name - Display name
 * @property {number} occupancy - Occupancy ratio 0–1
 * @property {number} capacity - Maximum fan capacity
 * @property {string} status - 'nominal' | 'moderate' | 'busy' | 'critical'
 *
 * @typedef {object} Gate
 * @property {string} id - Gate letter (A–F)
 * @property {string} direction - Compass direction
 * @property {number} density - Crowd density 0–1
 * @property {number} waitTimeMinutes - Estimated wait time
 * @property {string} status - 'normal' | 'watch' | 'critical'
 * @property {boolean} accessible - Wheelchair accessible
 * @property {string[]} [accessibleFeatures] - List of accessibility features
 */
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, ZONE_COLORS, GATE_STATUS_COLORS } from '../utils/styles';
import { getStatusColor } from '../utils/helpers';
import { useAIInsight } from '../hooks/useAIInsight';

const GATE_POSITIONS = {
  A: { x: 250, y: 22, dir: 'N' },
  B: { x: 310, y: 22, dir: 'N' },
  C: { x: 250, y: 378, dir: 'S' },
  D: { x: 310, y: 378, dir: 'S' },
  E: { x: 412, y: 200, dir: 'E' },
  F: { x: 88, y: 200, dir: 'W' },
};

/**
 * Interactive stadium SVG with zone selection
 * @component
 */
const StadiumSVG = memo(function StadiumSVG({
  zones,
  gates,
  onZoneClick,
  selectedZone,
  reducedMotion,
}) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const [hoveredZone, setHoveredZone] = useState(null);

  const handleKeyDown = (e, zone) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onZoneClick(zone);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((prev) => Math.min(prev + 1, zones.length - 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <svg
      viewBox="0 0 500 400"
      className="w-full h-full"
      style={{ maxHeight: '420px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
      role="application"
      aria-label="Interactive stadium map showing zone occupancy"
    >
      <defs>
        {/* Neon Glow Filter */}
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pitch Lighting Gradient */}
        <radialGradient id="pitch-light" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#15803d" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#14532d" stopOpacity="0.9" />
        </radialGradient>

        {/* Metallic Roof Gradient */}
        <linearGradient id="roof-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#f8fafc" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
        </linearGradient>

        {/* Stadium Shape Clip Path */}
        <clipPath id="stadium-clip">
          <ellipse cx="250" cy="200" rx="228" ry="183" />
        </clipPath>
      </defs>

      {/* Deep Background Base */}
      <rect x="10" y="10" width="480" height="380" rx="190" fill="#03050a" opacity="0.6" />

      {/* Realistic Pitch */}
      <g className="stadium-pitch">
        {/* Grass Base */}
        <rect
          x="120"
          y="110"
          width="260"
          height="180"
          rx="6"
          fill="url(#pitch-light)"
          stroke="#ffffff"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Pitch Lines */}
        <g stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" fill="none">
          {/* Outer Boundary */}
          <rect x="125" y="115" width="250" height="170" />
          {/* Center Line */}
          <line x1="250" y1="115" x2="250" y2="285" />
          {/* Center Circle */}
          <circle cx="250" cy="200" r="25" />
          {/* Center Dot */}
          <circle cx="250" cy="200" r="2" fill="#ffffff" stroke="none" />
          {/* Left Penalty Box */}
          <rect x="125" y="150" width="40" height="100" />
          {/* Left Goal Box */}
          <rect x="125" y="170" width="15" height="60" />
          {/* Right Penalty Box */}
          <rect x="335" y="150" width="40" height="100" />
          {/* Right Goal Box */}
          <rect x="360" y="170" width="15" height="60" />
        </g>
      </g>

      <g clipPath="url(#stadium-clip)">
        {/* Architectural Tiers (Underneath Active Zones) */}
        <path
          d="M 105 95 Q 250 40 395 95 L 430 40 Q 250 -30 70 40 Z"
          fill="#1e293b"
          opacity="0.3"
        />
        <path
          d="M 105 305 Q 250 360 395 305 L 430 360 Q 250 430 70 360 Z"
          fill="#1e293b"
          opacity="0.3"
        />
        <path
          d="M 105 105 Q 60 200 105 295 L 50 340 Q -20 200 50 60 Z"
          fill="#1e293b"
          opacity="0.3"
        />
        <path
          d="M 395 105 Q 440 200 395 295 L 450 340 Q 520 200 450 60 Z"
          fill="#1e293b"
          opacity="0.3"
        />

        {/* Interactive Seating Zones */}
        {zones.map((zone, idx) => {
          const c = ZONE_COLORS[zone.status] || ZONE_COLORS.nominal;
          const isSelected = selectedZone === zone.id;
          const isFocused = focusIndex === idx;
          const isHovered = hoveredZone === zone.id;

          let pathData = '';
          let textX = 250;
          let textY = 200;

          if (zone.id === 'north') {
            pathData = 'M 115 90 Q 250 45 385 90 L 420 35 Q 250 -30 80 35 Z';
            textY = 55;
          } else if (zone.id === 'south') {
            pathData = 'M 115 310 Q 250 355 385 310 L 420 365 Q 250 430 80 365 Z';
            textY = 350;
          } else if (zone.id === 'west') {
            pathData = 'M 100 105 Q 55 200 100 295 L 45 335 Q -20 200 45 65 Z';
            textX = 65;
          } else if (zone.id === 'east') {
            pathData = 'M 400 105 Q 445 200 400 295 L 455 335 Q 520 200 455 65 Z';
            textX = 435;
          }

          const baseProps = {
            d: pathData,
            fill: c.fill,
            opacity: isSelected ? 0.95 : isHovered ? 0.75 : 0.45,
            stroke: c.fill,
            strokeWidth: isSelected ? 3 : isHovered ? 2 : isFocused ? 2 : 1,
            filter:
              isSelected || zone.status === 'critical'
                ? 'url(#neon-glow)'
                : isHovered
                  ? 'url(#neon-glow)'
                  : 'none',
            cursor: 'pointer',
            onClick: () => onZoneClick(zone),
            onMouseEnter: () => setHoveredZone(zone.id),
            onMouseLeave: () => setHoveredZone(null),
            onFocus: () => setFocusIndex(idx),
            onKeyDown: (e) => handleKeyDown(e, zone),
            role: 'button',
            tabIndex: 0,
            'aria-label': `${zone.name}: ${Math.round(zone.occupancy * 100)}% capacity, ${c.label}`,
            'aria-pressed': isSelected,
            style: {
              transition: 'opacity 0.3s ease, stroke-width 0.2s ease, filter 0.3s ease',
              outline: isFocused ? '3px solid var(--color-secondary)' : 'none',
              outlineOffset: '2px',
            },
          };

          return (
            <g key={zone.id}>
              <path {...baseProps} />
              <text
                x={textX}
                y={textY - 5}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                fontWeight="800"
                letterSpacing="1"
                aria-hidden="true"
                style={{ pointerEvents: 'none' }}
              >
                {zone.id.charAt(0).toUpperCase()}
              </text>
              <text
                x={textX}
                y={textY + 10}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="600"
                aria-hidden="true"
                style={{ pointerEvents: 'none' }}
              >
                {Math.round(zone.occupancy * 100)}%
              </text>
            </g>
          );
        })}
      </g>

      {/* Outer Glass Roof / Canopy */}
      <ellipse
        cx="250"
        cy="200"
        rx="230"
        ry="185"
        fill="none"
        stroke="url(#roof-gradient)"
        strokeWidth="6"
        opacity="0.6"
        style={{ pointerEvents: 'none' }}
      />
      <ellipse
        cx="250"
        cy="200"
        rx="234"
        ry="189"
        fill="none"
        stroke="#00f0ff"
        strokeWidth="1"
        opacity="0.2"
        style={{ pointerEvents: 'none' }}
      />

      {/* Gate Hub Markers */}
      {gates.map((gate) => {
        const pos = GATE_POSITIONS[gate.id];
        if (!pos) return null;
        const gColor = getStatusColor(gate.status);
        return (
          <g
            key={gate.id}
            role="group"
            aria-label={`Gate ${gate.id}: ${gate.direction} side, ${gate.waitTimeMinutes} min wait`}
          >
            {/* Gate Connection Line */}
            <line
              x1="250"
              y1="200"
              x2={pos.x}
              y2={pos.y}
              stroke={gColor}
              strokeWidth="1"
              opacity="0.2"
              strokeDasharray="4 4"
            />

            {/* Base Gate Marker */}
            <circle cx={pos.x} cy={pos.y} r="16" fill="#0f1623" stroke={gColor} strokeWidth="2.5" />
            <circle cx={pos.x} cy={pos.y} r="12" fill={gColor} opacity="0.2" />

            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="800"
              aria-hidden="true"
            >
              {gate.id}
            </text>

            {/* Critical Pulse */}
            {gate.status === 'critical' && !reducedMotion && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r="16"
                fill="none"
                stroke={gColor}
                strokeWidth="2"
                filter="url(#neon-glow)"
              >
                <animate attributeName="r" values="16;26;16" dur="1.5s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  values="0.8;0;0.8"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}

      {/* Compass / Navigation Rose */}
      <g transform="translate(460, 30)" role="img" aria-label="Compass rose, north pointing up">
        <circle
          cx="0"
          cy="0"
          r="14"
          fill="#0f1623"
          stroke="#334155"
          strokeWidth="1"
          aria-hidden="true"
        />
        <text
          x="0"
          y="-1"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#94a3b8"
          fontSize="11"
          fontWeight="800"
          aria-hidden="true"
        >
          N
        </text>
        <path d="M 0 -14 L 4 -22 L 0 -18 L -4 -22 Z" fill="#00f0ff" aria-hidden="true" />
      </g>
    </svg>
  );
});

const INDOOR_ROUTES = {
  A: [
    { instruction: 'Enter through Gate A (North Entrance)', time: '2 min', icon: 'login' },
    { instruction: 'Proceed through security checkpoint row 3', time: '3 min', icon: 'security' },
    {
      instruction: 'Take the North Escalator up to Level 2 (Concourse)',
      time: '4 min',
      icon: 'stairs',
    },
    {
      instruction: 'Turn left and walk to Block 105 (North-East sector)',
      time: '2 min',
      icon: 'turn_left',
    },
  ],
  B: [
    { instruction: 'Enter through Gate B (North-East Entrance)', time: '2 min', icon: 'login' },
    { instruction: 'Proceed through security checkpoint row 6', time: '3 min', icon: 'security' },
    {
      instruction: 'Pass the food court, head to elevator bank C',
      time: '3 min',
      icon: 'elevator',
    },
    { instruction: 'Take elevator to Level 3, Section 202', time: '2 min', icon: 'arrow_upward' },
  ],
  C: [
    { instruction: 'Enter through Gate C (South Entrance)', time: '1 min', icon: 'login' },
    { instruction: 'Pass security checkpoint row 1', time: '3 min', icon: 'security' },
    { instruction: 'Walk past Concessions Stand 14', time: '2 min', icon: 'store' },
    { instruction: 'Access South Seating area via tunnel 12', time: '2 min', icon: 'tunnel' },
  ],
  D: [
    { instruction: 'Enter through Gate D (South-East Entrance)', time: '2 min', icon: 'login' },
    { instruction: 'Pass security checkpoint row 4', time: '2 min', icon: 'security' },
    { instruction: 'Walk up the South Ramp to Concourse 2', time: '5 min', icon: 'trending_up' },
    { instruction: 'Locate Section 120 directly on the right', time: '1 min', icon: 'turn_right' },
  ],
  E: [
    { instruction: 'Enter through Gate E (East Entrance)', time: '2 min', icon: 'login' },
    { instruction: 'Pass security checkpoint row 8', time: '3 min', icon: 'security' },
    {
      instruction: 'Walk past the fan zone merchandise megastore',
      time: '3 min',
      icon: 'shopping_bag',
    },
    { instruction: 'Take East Elevator to Suite Level 4', time: '2 min', icon: 'elevator' },
  ],
  F: [
    { instruction: 'Enter through Gate F (West Entrance)', time: '1 min', icon: 'login' },
    { instruction: 'Pass security checkpoint row 10', time: '3 min', icon: 'security' },
    {
      instruction: 'Walk down the accessibility ramp to the pitch level',
      time: '4 min',
      icon: 'accessible',
    },
    { instruction: 'Proceed to ADA Reserved Seating Block 11', time: '1 min', icon: 'check' },
  ],
};

/**
 * Crowd map main component
 */
function CrowdMap() {
  const contextData = useStadiumContext((s) => s.contextData);
  const gates = useStadiumContext((s) => s.contextData.gates);
  const stadium = useStadiumContext((s) => s.contextData.stadium);
  const [selectedZone, setSelectedZone] = useState();
  const [activeIndoorGate, setActiveIndoorGate] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const { insight: aiNavTip, requestInsight: requestNavTip } = useAIInsight(contextData);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const handleZoneClick = useCallback((zone) => {
    setSelectedZone((prev) => (prev === zone.id ? undefined : zone.id));
  }, []);

  const selectedZoneData = selectedZone
    ? stadium.zones.find((z) => z.id === selectedZone)
    : undefined;
  const bestGate = useMemo(() => gates.toSorted((a, b) => a.density - b.density)[0], [gates]);
  const worstZone = useMemo(
    () => stadium.zones.toSorted((a, b) => b.occupancy - a.occupancy)[0],
    [stadium.zones],
  );

  const navTipFallback = `🟢 Use Gate ${bestGate?.id || 'A'} for fastest entry — only ${bestGate?.waitTimeMinutes || 5} min wait. 🔴 ${worstZone?.name || 'Unknown'} is at ${Math.round((worstZone?.occupancy || 0) * 100)}% capacity.`;
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
        {/* Map */}
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

          {/* Legend */}
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
            reducedMotion={reducedMotion}
          />

          {/* Selected Zone Detail */}
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

        {/* Gates Panel */}
        <div className="flex flex-col gap-4">
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
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('AT&T Stadium, Arlington, TX')}&travelmode=walking&q=${encodeURIComponent(`Gate ${gate.id} AT&T Stadium Arlington TX`)}`;
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
                        aria-label="Wheelchair accessible"
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
                        aria-label="Hearing loop available"
                      >
                        hearing
                      </span>
                    )}
                    {/* Navigate to Gate button */}
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

                    {/* Indoor Navigation Button */}
                    <button
                      onClick={() =>
                        setActiveIndoorGate(gate.id === activeIndoorGate ? null : gate.id)
                      }
                      aria-label={`Show indoor wayfinding for Gate ${gate.id}`}
                      title={`Indoor wayfinding for Gate ${gate.id}`}
                      className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors"
                      style={{
                        background:
                          activeIndoorGate === gate.id
                            ? COLORS.secondaryContainer
                            : `${COLORS.secondary}22`,
                        color:
                          activeIndoorGate === gate.id
                            ? COLORS.onSecondaryContainer
                            : COLORS.secondary,
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

          {/* Indoor Navigation Detail Card */}
          {activeIndoorGate && (
            <div
              className="card p-4 animate-fade-in-up"
              style={{ border: `1px solid ${COLORS.outlineVariant}` }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: COLORS.secondary }}
                  >
                    explore
                  </span>
                  <h4 className="font-bold text-xs" style={{ color: COLORS.onSurface }}>
                    Indoor Navigation from Gate {activeIndoorGate}
                  </h4>
                </div>
                <button
                  onClick={() => setActiveIndoorGate(null)}
                  className="text-xs font-bold cursor-pointer"
                  style={{ color: COLORS.outline }}
                  aria-label="Close indoor navigation"
                >
                  ✕
                </button>
              </div>
              <div
                className="flex flex-col gap-3 font-mono text-[11px]"
                style={{ color: COLORS.onSurfaceVariant }}
              >
                {INDOOR_ROUTES[activeIndoorGate]?.map((step) => (
                  <div key={crypto.randomUUID()} className="flex gap-2.5 items-start">
                    <span
                      className="material-symbols-outlined text-xs shrink-0 mt-0.5"
                      style={{ color: COLORS.primary }}
                    >
                      {step.icon}
                    </span>
                    <div className="flex-1">
                      <div>{step.instruction}</div>
                      <div className="text-[10px]" style={{ color: COLORS.outline }}>
                        Duration: {step.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Navigation Tip — GenAI powered */}
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
