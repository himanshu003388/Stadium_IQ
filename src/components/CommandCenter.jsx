/**
 * Command Center Component - Real-time stadium operations dashboard
 * Displays KPIs, zone status, gate information, and active incidents.
 *
 * @component
 * @typedef {object} Incident
 * @property {string} id - Unique incident ID
 * @property {string} description - Human-readable description
 * @property {'critical'|'medium'|'low'} severity - Severity level
 * @property {'active'|'resolved'} status - Current status
 * @property {string} type - Incident category (crowd, medical, security, etc.)
 * @property {string} timestamp - ISO timestamp
 * @property {string} aiRecommendedAction - AI-suggested mitigation action
 */
import React, { useMemo, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, ZONE_COLORS } from '../utils/styles';
import { SEVERITY_BADGE_MAP, STATUS_DOT_COLORS, INCIDENT_ICON_MAP } from '../utils/constants';
import { timeAgo, getDensityColor, getStatusColor, getSeverityColor } from '../utils/helpers';
import { useAIInsight } from '../hooks/useAIInsight';

/**
 * Severity badge component
 * @param {object} props - Component props
 * @param {string} props.severity - Severity level
 */
const SeverityBadge = memo(function SeverityBadge({ severity }) {
  return <span className={SEVERITY_BADGE_MAP[severity] || 'badge-info'}>{severity}</span>;
});
SeverityBadge.propTypes = { severity: PropTypes.string.isRequired };

/**
 * Status dot indicator component — uses color + accessible text label
 * to satisfy WCAG 1.4.1 (Use of Color).
 * @param {object} props - Component props
 * @param {string} props.status - Status level
 */
const StatusDot = memo(function StatusDot({ status }) {
  return (
    <span
      className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0"
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status !== 'resolved' && (
        <span
          className="absolute w-full h-full rounded-full animate-ping opacity-50"
          aria-hidden="true"
          style={{ background: STATUS_DOT_COLORS[status] || COLORS.outline }}
        />
      )}
      <span
        className="w-2 h-2 rounded-full"
        aria-hidden="true"
        style={{ background: STATUS_DOT_COLORS[status] || COLORS.outline }}
      />
      {/* Visually-hidden text: ensures status is not conveyed by color alone (WCAG 1.4.1) */}
      <span className="sr-only">{status}</span>
    </span>
  );
});
StatusDot.propTypes = { status: PropTypes.string.isRequired };

/**
 * Key Performance Indicator (KPI) card component
 * @param {object} props - Component props
 * @param {string} props.label - KPI label
 * @param {number|string} props.value - KPI value
 * @param {string} [props.unit] - Unit of measurement
 * @param {string} props.icon - Material symbol icon name
 * @param {string} props.color - Color for the value
 * @param {string} [props.sub] - Subtitle text
 * @param {number} props.delay - Stagger delay for animation
 */
const KPICard = memo(function KPICard({ label, value, unit, icon, color, sub, delay }) {
  return (
    <div className={`card p-5 animate-fade-in-up stagger-${delay}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-label-sm" style={{ color: COLORS.outline }}>
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-xl"
            style={{ color, fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-1" aria-live="polite" aria-atomic="true">
        <span className="text-metric-lg animate-count-up" style={{ color }}>
          {value}
        </span>
        {unit && (
          <span className="text-xl font-bold" style={{ color: COLORS.onSurfaceVariant }}>
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <p className="text-xs mt-1.5" style={{ color: COLORS.outline }}>
          {sub}
        </p>
      )}
    </div>
  );
});
KPICard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  sub: PropTypes.string,
  delay: PropTypes.number.isRequired,
};

/**
 * Gate status row component
 * @param {object} props - Component props
 * @param {object} props.gate - Gate data
 */
const GateRow = memo(function GateRow({ gate }) {
  const statusColor = getStatusColor(gate.status);
  const fillColor = getDensityColor(gate.density);

  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: statusColor }}
      >
        {gate.id}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium" style={{ color: COLORS.onSurface }}>
            Gate {gate.id} — {gate.direction}
          </span>
          <span className="font-mono font-semibold" style={{ color: fillColor }}>
            {Math.round(gate.density * 100)}%
          </span>
        </div>
        <div className="density-bar">
          <div
            className="density-fill"
            style={{ width: `${gate.density * 100}%`, background: fillColor }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <div
          className="text-xs font-bold font-mono"
          style={{ color: gate.waitTimeMinutes > 15 ? COLORS.error : COLORS.onSurfaceVariant }}
        >
          {gate.waitTimeMinutes}m
        </div>
        {gate.accessible && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-sm"
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
            className="material-symbols-outlined text-sm"
            style={{ color: COLORS.secondary, fontVariationSettings: "'FILL' 1" }}
            title="Hearing loop"
            aria-label="Hearing loop available"
          >
            hearing
          </span>
        )}
      </div>
    </div>
  );
});

GateRow.propTypes = {
  gate: PropTypes.shape({
    status: PropTypes.string.isRequired,
    density: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
    direction: PropTypes.string.isRequired,
    waitTimeMinutes: PropTypes.number.isRequired,
    accessible: PropTypes.bool,
    accessibleFeatures: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

/**
 * Incident card component
 * @param {object} props - Component props
 * @param {object} props.incident - Incident data
 * @param {function} props.onResolve - Resolve callback
 */
const IncidentCard = memo(function IncidentCard({ incident, onResolve }) {
  const severityColor = getSeverityColor(incident.severity);
  const severityBg =
    incident.severity === 'critical'
      ? 'var(--color-error-container)'
      : incident.severity === 'medium'
        ? 'var(--color-warning-container)'
        : 'var(--color-info-container)';

  return (
    <div
      className={`card p-4 animate-fade-in-up border-l-4 ${incident.status === 'resolved' ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: severityColor }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: severityBg }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-xl"
            style={{ color: severityColor, fontVariationSettings: "'FILL' 1" }}
          >
            {INCIDENT_ICON_MAP[incident.type] || 'warning'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono font-bold" style={{ color: COLORS.outline }}>
              {incident.id}
            </span>
            <SeverityBadge severity={incident.severity} />
            {incident.status === 'resolved' && <span className="badge-success">Resolved</span>}
            <span className="text-xs ml-auto" style={{ color: COLORS.onSurfaceVariant }}>
              {timeAgo(incident.timestamp)}
            </span>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: COLORS.onSurface }}>
            {incident.description}
          </p>
          <div
            className="flex items-start gap-1.5 p-2 rounded-lg"
            style={{ background: COLORS.surface }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-sm shrink-0 mt-0.5"
              style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              smart_toy
            </span>
            <p className="text-xs" style={{ color: COLORS.onSurfaceVariant }}>
              <span className="font-semibold" style={{ color: COLORS.primaryContainer }}>
                AI Action:{' '}
              </span>
              {incident.aiRecommendedAction}
            </p>
          </div>
        </div>
      </div>
      {incident.status === 'active' && (
        <div className="mt-3 flex justify-end">
          <button
            className="btn-ghost text-xs py-1.5 px-3"
            onClick={() => onResolve(incident.id)}
            aria-label={`Mark incident ${incident.id} as resolved`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              check_circle
            </span>
            Mark Resolved
          </button>
        </div>
      )}
    </div>
  );
});

IncidentCard.propTypes = {
  incident: PropTypes.shape({
    id: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date).isRequired,
    description: PropTypes.string.isRequired,
    aiRecommendedAction: PropTypes.string,
  }).isRequired,
  onResolve: PropTypes.func.isRequired,
};

/**
 * Smart Broadcast Widget
 */
const SmartBroadcastWidget = memo(function SmartBroadcastWidget() {
  const { contextData } = useStadiumContext();
  const { requestInsight: requestBroadcast } = useAIInsight(contextData);
  const [message, setMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcasted, setBroadcasted] = useState(false);

  const handleBroadcast = () => {
    if (!message.trim()) return;
    setIsBroadcasting(true);
    requestBroadcast(`Translate this stadium announcement to 7 languages (EN, ES, FR, AR, PT, JA, HI) and return the translations. Announcement: "${message}". Return the translations in a bullet list.`, '');
    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcasted(true);
      setTimeout(() => setBroadcasted(false), 5000);
      setMessage('');
    }, 1500);
  };

  return (
    <div className="card p-5 animate-fade-in-up stagger-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          aria-hidden="true"
          className="material-symbols-outlined"
          style={{ color: COLORS.secondary, fontVariationSettings: "'FILL' 1" }}
        >
          record_voice_over
        </span>
        <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
          Smart PA System (GenAI Multilingual Broadcast)
        </h2>
      </div>
      <p className="text-xs mb-3" style={{ color: COLORS.outline }}>
        Enter an announcement in English. The AI will instantly translate and push audio to all zone
        PA systems in 7 languages.
      </p>
      <textarea
        className="w-full bg-transparent border rounded-xl p-3 text-sm focus:outline-none focus:border-primary mb-3"
        style={{ borderColor: COLORS.surfaceDim, color: COLORS.onSurface }}
        rows="2"
        aria-label="Enter broadcast announcement"
        placeholder="e.g., Gate C is temporarily closed. Please use Gate D."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex justify-between items-center">
        <div className="flex gap-2 text-xs">
          {['EN', 'ES', 'FR', 'AR', 'PT', 'JA', 'HI'].map((lang) => (
            <span
              key={lang}
              className="px-1.5 py-0.5 rounded"
              style={{ background: COLORS.surfaceDim, color: COLORS.outline }}
            >
              {lang}
            </span>
          ))}
        </div>
        <button
          onClick={handleBroadcast}
          disabled={!message.trim() || isBroadcasting}
          className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
          style={broadcasted ? { background: COLORS.success, color: COLORS.onSuccess } : {}}
        >
          <span className="material-symbols-outlined text-sm">
            {broadcasted ? 'check_circle' : isBroadcasting ? 'autorenew' : 'campaign'}
          </span>
          {broadcasted
            ? 'Broadcast Sent'
            : isBroadcasting
              ? 'Translating...'
              : 'Generate & Broadcast'}
        </button>
      </div>
    </div>
  );
});
SmartBroadcastWidget.propTypes = {};

function CommandCenter() {
  const { contextData, resolveIncident } = useStadiumContext();
  const { gates, stadium, incidents } = contextData;

  const avgDensity = useMemo(
    () => Math.round((gates.reduce((s, g) => s + g.density, 0) / gates.length) * 100),
    [gates],
  );
  const occupancyPct = useMemo(
    () => Math.round((stadium.currentOccupancy / stadium.capacity) * 100),
    [stadium.currentOccupancy, stadium.capacity],
  );
  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status === 'active'),
    [incidents],
  );
  const criticalGates = useMemo(() => gates.filter((g) => g.status === 'critical'), [gates]);
  const predictiveGates = useMemo(
    () => gates.filter((g) => g.predictedDensity > 0.85 && g.status !== 'critical'),
    [gates],
  );
  const recommendedGatesText = useMemo(() => {
    return gates
      .filter((g) => g.status === 'normal')
      .map((g) => g.id)
      .slice(0, 2)
      .join(', ');
  }, [gates]);

  return (
    <div
      className="p-4 md:p-6 flex flex-col gap-5"
      role="region"
      aria-label="Command Center Dashboard"
    >
      {/* Alert Banner */}
      {criticalGates.length > 0 && (
        <div
          className="rounded-xl p-3.5 flex items-center gap-3 animate-slide-right"
          role="alert"
          aria-live="assertive"
          style={{
            background: COLORS.gradientCritical,
            boxShadow: '0 4px 20px rgba(198,40,40,0.3)',
          }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            campaign
          </span>
          <div>
            <p className="text-white font-bold text-sm">
              ⚠️ CRITICAL: High congestion at Gate{criticalGates.length > 1 ? 's' : ''}{' '}
              {criticalGates.map((g) => g.id).join(', ')}
            </p>
            <p className="text-white text-xs opacity-80">
              AI recommends redirecting fans to Gates {recommendedGatesText}
            </p>
          </div>
        </div>
      )}

      {/* Predictive Alert Banner */}
      {predictiveGates.length > 0 && (
        <div
          className="rounded-xl p-3.5 flex items-center gap-3 animate-slide-right"
          role="alert"
          aria-live="polite"
          style={{
            background: COLORS.warningContainer,
            border: `1px solid ${COLORS.warning}`,
          }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined"
            style={{ color: COLORS.warning, fontVariationSettings: "'FILL' 1" }}
          >
            insights
          </span>
          <div>
            <p className="font-bold text-sm" style={{ color: COLORS.onWarningContainer }}>
              🧠 PROACTIVE: Gate{predictiveGates.length > 1 ? 's' : ''}{' '}
              {predictiveGates.map((g) => g.id).join(', ')} predicted to hit critical density in 15
              mins.
            </p>
            <p className="text-xs opacity-80" style={{ color: COLORS.onWarningContainer }}>
              AI recommends opening auxiliary stanchions or redirecting approaching traffic now.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Key Performance Indicators"
      >
        <KPICard
          label="Crowd Density"
          value={avgDensity}
          unit="%"
          icon="groups"
          color={COLORS.primary}
          delay={1}
          sub={`${criticalGates.length} critical gate${criticalGates.length !== 1 ? 's' : ''}`}
        />
        <KPICard
          label="Occupancy"
          value={occupancyPct}
          unit="%"
          icon="people"
          color={COLORS.tertiary}
          delay={2}
          sub={`${stadium.currentOccupancy.toLocaleString()} of ${stadium.capacity.toLocaleString()}`}
        />
        <KPICard
          label="Active Incidents"
          value={activeIncidents.length}
          icon="emergency"
          color={activeIncidents.length > 2 ? COLORS.error : COLORS.warning}
          delay={3}
          sub={`${incidents.filter((i) => i.status === 'resolved').length} resolved today`}
        />
        <KPICard
          label="Temperature"
          value={stadium.weather.temperature}
          unit="°C"
          icon="thermometer"
          color={COLORS.secondary}
          delay={4}
          sub={`${stadium.weather.conditions} · ${stadium.weather.humidity}% humidity`}
        />
      </section>

      {/* Zones + Gates */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        role="region"
        aria-label="Zone and Gate Status"
      >
        {/* Zone Occupancy */}
        <div className="card p-5 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              grid_view
            </span>
            <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              Zone Occupancy
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stadium.zones.map((zone) => {
              const zColor =
                ZONE_COLORS[
                  zone.status === 'nominal'
                    ? 'nominal'
                    : zone.status === 'busy'
                      ? 'busy'
                      : zone.status === 'moderate'
                        ? 'moderate'
                        : 'critical'
                ];
              return (
                <div
                  key={zone.id}
                  className="p-3 rounded-xl"
                  style={{ background: `${zColor.fill}12`, border: `1.5px solid ${zColor.fill}30` }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: COLORS.onSurfaceVariant }}
                    >
                      {zone.name}
                    </span>
                    <StatusDot
                      status={
                        zone.status === 'nominal'
                          ? 'resolved'
                          : zone.status === 'busy'
                            ? 'active'
                            : zone.status
                      }
                    />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: zColor.fill }}>
                    {Math.round(zone.occupancy * 100)}%
                  </div>
                  <div className="density-bar mt-1.5">
                    <div
                      className="density-fill"
                      style={{
                        width: `${Math.round(zone.occupancy * 100)}%`,
                        background: zColor.fill,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gate Status */}
        <div className="card p-5 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              sensor_door
            </span>
            <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              Gate Status
            </h2>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono"
              style={{ background: COLORS.warningContainer, color: COLORS.warning }}
            >
              Live
            </span>
          </div>
          <div className="flex flex-col">
            {gates.map((gate, idx) => (
              <div
                key={gate.id}
                style={{ borderTop: idx > 0 ? `1px solid ${COLORS.surface}` : 'none' }}
              >
                <GateRow gate={gate} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Broadcast */}
      <SmartBroadcastWidget />

      {/* Incident Feed */}
      <div
        className="animate-fade-in-up stagger-4"
        role="region"
        aria-label="Incident feed"
        aria-live="assertive"
        aria-relevant="additions removals"
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            aria-hidden="true"
            className="material-symbols-outlined"
            style={{ color: COLORS.error, fontVariationSettings: "'FILL' 1" }}
          >
            emergency
          </span>
          <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
            Active Incidents
          </h2>
          <span className="badge-critical ml-1" aria-live="polite" aria-atomic="true">
            {activeIncidents.length} active
          </span>
        </div>
        {/* Incident list — bounded height prevents layout thrashing with large incident volumes */}
        <div
          className="flex flex-col gap-3 overflow-y-auto custom-scrollbar"
          style={{ maxHeight: '520px' }}
        >
          {incidents.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} onResolve={resolveIncident} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(CommandCenter);
