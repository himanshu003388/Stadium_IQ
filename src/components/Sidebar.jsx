/**
 * Sidebar Component - Navigation sidebar and venue info panel
 * @component
 */
import React, { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { useStadiumContext } from '../context/StadiumContext';
import { useAppContext } from '../context/AppContext';
import { COLORS, NAV_ITEMS } from '../utils/styles';

const MOBILE_LABEL_MAP = {
  dashboard: 'Ops Center',
  assistant: 'AI',
  crowdmap: 'Crowd',
  volunteers: 'Dispatch',
  transport: 'Transport',
  sustainability: 'Sustain',
  accessibility: 'Access',
  vendors: 'Concessions',
  'volunteer-mobile': 'Tasks',
};

/**
 * Returns a badge count for a nav item based on active alerts
 * @param {string} id - Navigation item ID
 * @param {number} activeIncidents - Active incident count
 * @param {number} criticalGates - Critical gate count
 * @param {number} openTasks - Open task count
 * @returns {number|null} Badge count or null
 */
const getBadge = (id, activeIncidents, criticalGates, openTasks) => {
  if (id === 'dashboard' && activeIncidents > 0) return activeIncidents;
  if (id === 'crowdmap' && criticalGates > 0) return criticalGates;
  if (id === 'volunteers' && openTasks > 0) return openTasks;
  return null;
};

/**
 * Sidebar component with venue info, navigation links, and system status
 * @param {object} props - Component props
 * @param {string} props.activeView - Currently active view ID
 * @param {function} props.setActiveView - View setter callback
 * @returns {React.ReactElement}
 */
function Sidebar({ activeView, setActiveView }) {
  const { contextData } = useStadiumContext();
  const { role } = useAppContext();
  const criticalGates = useMemo(
    () => contextData.gates.filter((g) => g.status === 'critical').length,
    [contextData.gates],
  );
  const activeIncidents = useMemo(
    () => contextData.incidents.filter((i) => i.status === 'active').length,
    [contextData.incidents],
  );
  const openTasks = useMemo(
    () => contextData.tasks.filter((t) => t.status === 'open').length,
    [contextData.tasks],
  );

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.allowedRoles?.includes(role)),
    [role],
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-20 bottom-0 w-72 z-40 custom-scrollbar overflow-y-auto"
        role="complementary"
        aria-label="Navigation sidebar"
        style={{
          background: COLORS.surface,
          borderRight: `1px solid ${COLORS.surfaceDim}`,
          boxShadow: `2px 0 12px ${COLORS.primary}0f`,
        }}
      >
        {/* Stadium Info */}
        <div className="p-4 border-b" style={{ borderColor: COLORS.surfaceDim }}>
          <div className="text-xs font-medium mb-1" style={{ color: COLORS.outline }}>
            VENUE
          </div>
          <div className="font-bold text-sm" style={{ color: COLORS.primary }}>
            {contextData.stadium.name}
          </div>
          <div className="text-xs" style={{ color: COLORS.outline }}>
            {contextData.stadium.city}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: COLORS.error }}
            ></span>
            <span className="text-xs font-medium" style={{ color: COLORS.error }}>
              LIVE
            </span>
            <span className="text-xs" style={{ color: COLORS.outline }}>
              — {contextData.stadium.matchPhase}
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 flex flex-col gap-2" aria-label="Main navigation">
          {allowedNavItems.map((item) => {
            const badge = getBadge(item.id, activeIncidents, criticalGates, openTasks);
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                aria-label={item.label}
                aria-current={activeView === item.id ? 'page' : undefined}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-2xl shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0 ml-1">
                  <div className="text-sm font-semibold truncate">{item.label}</div>
                  {activeView !== item.id && (
                    <div className="text-xs opacity-60 truncate">{item.desc}</div>
                  )}
                </div>
                {badge && (
                  <span
                    className="ml-auto shrink-0 min-w-[18px] h-[18px] rounded-full text-center text-xs font-bold flex items-center justify-center px-1"
                    aria-label={`${badge} alerts`}
                    style={{ background: COLORS.error, color: COLORS.onPrimary, fontSize: '10px' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="p-4 border-t"
          style={{ borderColor: COLORS.surfaceDim, background: COLORS.surfaceBright }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS.success }}></span>
            <span className="text-xs font-medium" style={{ color: COLORS.success }}>
              Systems Nominal
            </span>
          </div>
          <div className="text-xs" style={{ color: COLORS.outline }}>
            {Math.round(
              (contextData.stadium.currentOccupancy / contextData.stadium.capacity) * 100,
            )}
            % capacity &bull; {contextData.stadium.sustainability.renewablePercentage}% renewable
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t"
        aria-label="Mobile navigation"
        style={{
          background: COLORS.surface,
          borderColor: COLORS.surfaceDim,
          boxShadow: `0 -4px 20px ${COLORS.primary}1a`,
        }}
      >
        {allowedNavItems.map((item) => {
          const badge = getBadge(item.id, activeIncidents, criticalGates, openTasks);
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              aria-label={item.label}
              aria-current={activeView === item.id ? 'page' : undefined}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 relative transition-all"
              style={{ color: activeView === item.id ? COLORS.primary : COLORS.outline }}
            >
              <span
                className="material-symbols-outlined text-xl"
                aria-hidden="true"
                style={{ fontVariationSettings: activeView === item.id ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span
                className="text-xs"
                style={{ fontSize: '9px', fontWeight: activeView === item.id ? 700 : 400 }}
              >
                {MOBILE_LABEL_MAP[item.id] || item.label}
              </span>
              {badge && (
                <span
                  className="absolute top-1 right-1/4 w-4 h-4 rounded-full text-center flex items-center justify-center"
                  aria-label={`${badge} alerts`}
                  style={{
                    background: COLORS.error,
                    color: COLORS.onPrimary,
                    fontSize: '9px',
                    fontWeight: 700,
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}

Sidebar.propTypes = {
  activeView: PropTypes.string.isRequired,
  setActiveView: PropTypes.func.isRequired,
};

export default memo(Sidebar);
