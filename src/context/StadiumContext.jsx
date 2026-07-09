/**
 * Stadium Data Context Provider
 * Manages real-time stadium state with live simulation
 * Separated from AppContext (theme, activeView) to prevent
 * unnecessary re-renders of UI-only consumers on simulation ticks
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import initialMockContext from '../data/mockContext.json';
import { useAppContext, AppProvider } from './AppContext';
import { NotificationProvider, useNotifications } from './NotificationContext';

const StadiumDataContext = createContext(null);

/**
 * Hook to access stadium simulation data (gates, incidents, etc.)
 * @returns {object} Stadium data and actions
 */
export const useStadiumData = () => {
  const ctx = useContext(StadiumDataContext);
  if (!ctx) throw new Error('useStadiumData must be used within a StadiumProvider');
  return ctx;
};

/**
 * Combined hook for backward compat — merges data + app context
 * Prefer useStadiumData() / useAppContext() for targeted subscriptions
 * @returns {object} Full context
 */
export const useStadiumContext = () => {
  const data = useStadiumData();
  const app = useAppContext();
  return useMemo(() => ({ ...data, ...app }), [data, app]);
};

const SIMULATION_VIEWS = new Set(['dashboard', 'crowdmap', 'volunteers', 'sustainability', 'vendors']);

function InnerProvider({ children }) {
  const [contextData, setContextData] = useState(initialMockContext);
  const [isSimulating, setIsSimulating] = useState(true);
  const { activeView } = useAppContext();
  const { addNotification } = useNotifications();
  const prevCriticalRef = useRef(0);
  const notificationCooldownRef = useRef({});

  useEffect(() => {
    if (!isSimulating) return;
    if (!SIMULATION_VIEWS.has(activeView)) return;

    let interval = null;

    function startInterval() {
      interval = setInterval(() => {
        setContextData((prev) => {
          const newGates = prev.gates.map((gate) => {
            const delta = (Math.random() - 0.48) * 0.04;
            const newDensity = Math.max(0.05, Math.min(0.99, gate.density + delta));
            const newWait = Math.max(1, Math.round(newDensity * 30));
            const newStatus =
              newDensity > 0.85 ? 'critical' : newDensity > 0.65 ? 'watch' : 'normal';
            const predictedDensity = parseFloat(Math.min(1.0, newDensity + 0.12).toFixed(2));
            return {
              ...gate,
              density: parseFloat(newDensity.toFixed(2)),
              predictedDensity,
              waitTimeMinutes: newWait,
              status: newStatus,
            };
          });

          const newOccupancy = Math.max(
            80000,
            Math.min(
              prev.stadium.capacity,
              prev.stadium.currentOccupancy + Math.round((Math.random() - 0.5) * 200),
            ),
          );

          const newVendors = (prev.vendors || []).map((vendor) => {
            const depletion = Math.round(Math.random() * 3);
            const newStock = Math.max(0, vendor.stockLevel - depletion);
            return {
              ...vendor,
              stockLevel: newStock,
              status: newStock < 20 ? 'critical' : newStock < 50 ? 'warning' : 'nominal',
            };
          });

          const now = Date.now();
          const newCriticalCount = newGates.filter((g) => g.status === 'critical').length;
          if (newCriticalCount > prevCriticalRef.current) {
            const cooldownKey = 'gate-critical';
            if (!notificationCooldownRef.current[cooldownKey] ||
                now - notificationCooldownRef.current[cooldownKey] > 30000) {
              notificationCooldownRef.current[cooldownKey] = now;
              const criticalGates = newGates.filter((g) => g.status === 'critical');
              addNotification({
                title: 'CRITICAL: Gate Congestion',
                message: `Gate${criticalGates.length > 1 ? 's' : ''} ${criticalGates.map((g) => g.id).join(', ')} at critical density. AI recommends rerouting fans.`,
                severity: 'critical',
                duration: 10000,
              });
            }
          }
          prevCriticalRef.current = newCriticalCount;

          return {
            ...prev,
            gates: newGates,
            stadium: { ...prev.stadium, currentOccupancy: newOccupancy },
            vendors: newVendors,
          };
        });
      }, 8000);
    }

    function stopInterval() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    // Pause simulation when tab is hidden to save CPU
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stopInterval();
      } else {
        stopInterval(); // clear any stale interval first
        startInterval();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startInterval(); // start immediately

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopInterval();
    };
  }, [isSimulating, activeView, addNotification]);

  const assignVolunteer = useCallback((taskId, volunteerId) => {
    setContextData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, assignedTo: volunteerId, status: 'in-progress' } : t,
      ),
      volunteers: prev.volunteers.map((v) =>
        v.id === volunteerId ? { ...v, currentLoad: Math.min(v.maxLoad, v.currentLoad + 1) } : v,
      ),
    }));
  }, []);

  const resolveTask = useCallback((taskId) => {
    setContextData((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: 'resolved' } : t)),
        volunteers: prev.volunteers.map((v) =>
          v.id === task?.assignedTo ? { ...v, currentLoad: Math.max(0, v.currentLoad - 1) } : v,
        ),
      };
    });
  }, []);

  const toggleEcoMode = useCallback(() => {
    setContextData((prev) => ({
      ...prev,
      stadium: {
        ...prev.stadium,
        sustainability: {
          ...prev.stadium.sustainability,
          ecoModeActive: !prev.stadium.sustainability.ecoModeActive,
          energyDrawMW: !prev.stadium.sustainability.ecoModeActive
            ? parseFloat((prev.stadium.sustainability.energyDrawMW * 0.78).toFixed(1))
            : parseFloat((prev.stadium.sustainability.energyDrawMW / 0.78).toFixed(1)),
        },
      },
    }));
  }, []);

  const resolveIncident = useCallback((incidentId) => {
    setContextData((prev) => ({
      ...prev,
      incidents: prev.incidents.map((i) =>
        i.id === incidentId ? { ...i, status: 'resolved' } : i,
      ),
    }));
  }, []);

  const value = useMemo(
    () => ({
      contextData,
      isSimulating,
      setIsSimulating,
      assignVolunteer,
      resolveTask,
      toggleEcoMode,
      resolveIncident,
    }),
    [contextData, isSimulating, assignVolunteer, resolveTask, toggleEcoMode, resolveIncident],
  );

  return <StadiumDataContext.Provider value={value}>{children}</StadiumDataContext.Provider>;
}

export function StadiumProvider({ children }) {
  return (
    <AppProvider>
      <NotificationProvider>
        <InnerProvider>{children}</InnerProvider>
      </NotificationProvider>
    </AppProvider>
  );
}
