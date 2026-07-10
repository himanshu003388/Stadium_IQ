import React, { useMemo, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, ZONE_COLORS } from '../utils/styles';
import KPICard from './command-center/KPICard';
import StatusDot from './command-center/StatusDot';
import GateRow from './command-center/GateRow';
import IncidentCard from './command-center/IncidentCard';
import SmartBroadcastWidget from './command-center/SmartBroadcastWidget';

/**
 * Command Center Dashboard Component
 * Displays real-time stadium KPIs, active incident tracking feeds, and broadcast controllers.
 *
 * @component
 */
function CommandCenter() {
  const gates = useStadiumContext((s) => s.contextData.gates);
  const stadium = useStadiumContext((s) => s.contextData.stadium);
  const incidents = useStadiumContext((s) => s.contextData.incidents);
  const resolveIncident = useStadiumContext((s) => s.resolveIncident);

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
              CRITICAL: High congestion at Gate{criticalGates.length > 1 ? 's' : ''}{' '}
              {criticalGates.map((g) => g.id).join(', ')}
            </p>
            <p className="text-white text-xs opacity-80">
              AI recommends redirecting fans to Gates {recommendedGatesText}
            </p>
          </div>
        </div>
      )}

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
              PROACTIVE: Gate{predictiveGates.length > 1 ? 's' : ''}{' '}
              {predictiveGates.map((g) => g.id).join(', ')} predicted to hit critical density in 15
              mins.
            </p>
            <p className="text-xs opacity-80" style={{ color: COLORS.onWarningContainer }}>
              AI recommends opening auxiliary stanchions or redirecting approaching traffic now.
            </p>
          </div>
        </div>
      )}

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

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        role="region"
        aria-label="Zone and Gate Status"
      >
        <div className="card p-5 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              grid_view
            </span>
            <h2 className="font-bold text-sm color-on-surface">Zone Occupancy</h2>
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
                  role="article"
                  tabIndex={0}
                  aria-label={`${zone.name} zone — ${Math.round(zone.occupancy * 100)}% occupancy, status: ${zone.status}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.currentTarget.click();
                    }
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold color-on-surface-variant">
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

        <div className="card p-5 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              sensor_door
            </span>
            <h2 className="font-bold text-sm color-on-surface">Gate Status</h2>
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

      <SmartBroadcastWidget />

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
          <h2 className="font-bold text-sm color-on-surface">Active Incidents</h2>
          <span className="badge-critical ml-1" aria-live="polite" aria-atomic="true">
            {activeIncidents.length} active
          </span>
        </div>
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
