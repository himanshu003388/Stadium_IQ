/**
 * Stadium Data Context Provider
 * Manages real-time stadium state with live simulation
 * Separated from AppContext (theme, activeView) to prevent
 * unnecessary re-renders of UI-only consumers on simulation ticks
 */
import React, { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import initialMockContext from '../data/mockContext.json';
import { useAppContext, AppProvider } from './AppContext';
import { NotificationProvider, useNotifications } from './NotificationContext';

const StadiumStoreContext = createContext(null);

/**
 * Minimum simulated occupancy floor
 */
const MIN_OCCUPANCY_SIMULATION = 80000;

/**
 * Hook to access stadium simulation data using a selector
 * @param {function} selector - Function to select specific state slice
 * @returns {any} Selected data
 */
export const useStadiumContext = (selector = (s) => s) => {
  const store = useContext(StadiumStoreContext);
  if (!store) throw new Error('useStadiumContext must be used within a StadiumProvider');

  // Use React 18 native useSyncExternalStore for fine-grained reactivity
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
};

// Deprecated: keeping for backwards compatibility until refactor is complete
export const useStadiumData = (selector = (s) => s) => {
  return useStadiumContext(selector);
};

const SIMULATION_VIEWS = new Set([
  'dashboard',
  'crowdmap',
  'volunteers',
  'sustainability',
  'vendors',
]);

function InnerProvider({ children }) {
  const { activeView } = useAppContext();
  const { addNotification } = useNotifications();
  const prevCriticalRef = useRef(0);
  const notificationCooldownRef = useRef({});

  // Initialize the pub-sub store once
  const storeRef = useRef(null);
  if (!storeRef.current) {
    const listeners = new Set();
    let state = {
      contextData: initialMockContext,
      isSimulating: true,
    };

    // Store API
    const getState = () => state;
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const setState = (updater) => {
      const nextState = typeof updater === 'function' ? updater(state) : updater;
      if (nextState !== state) {
        state = nextState;
        listeners.forEach((l) => l());
      }
    };

    // Actions
    const assignVolunteer = (taskId, volunteerId) => {
      setState((prev) => ({
        ...prev,
        contextData: {
          ...prev.contextData,
          tasks: prev.contextData.tasks.map((t) =>
            t.id === taskId ? { ...t, assignedTo: volunteerId, status: 'in-progress' } : t,
          ),
          volunteers: prev.contextData.volunteers.map((v) =>
            v.id === volunteerId
              ? { ...v, currentLoad: Math.min(v.maxLoad, v.currentLoad + 1) }
              : v,
          ),
        },
      }));
    };

    const resolveTask = (taskId) => {
      setState((prev) => {
        const task = prev.contextData.tasks.find((t) => t.id === taskId);
        return {
          ...prev,
          contextData: {
            ...prev.contextData,
            tasks: prev.contextData.tasks.map((t) =>
              t.id === taskId ? { ...t, status: 'resolved' } : t,
            ),
            volunteers: prev.contextData.volunteers.map((v) =>
              v.id === task?.assignedTo ? { ...v, currentLoad: Math.max(0, v.currentLoad - 1) } : v,
            ),
          },
        };
      });
    };

    const toggleEcoMode = () => {
      setState((prev) => ({
        ...prev,
        contextData: {
          ...prev.contextData,
          stadium: {
            ...prev.contextData.stadium,
            sustainability: {
              ...prev.contextData.stadium.sustainability,
              ecoModeActive: !prev.contextData.stadium.sustainability.ecoModeActive,
              energyDrawMW: !prev.contextData.stadium.sustainability.ecoModeActive
                ? parseFloat(
                    (prev.contextData.stadium.sustainability.energyDrawMW * 0.78).toFixed(1),
                  )
                : parseFloat(
                    (prev.contextData.stadium.sustainability.energyDrawMW / 0.78).toFixed(1),
                  ),
            },
          },
        },
      }));
    };

    const resolveIncident = (incidentId) => {
      setState((prev) => ({
        ...prev,
        contextData: {
          ...prev.contextData,
          incidents: prev.contextData.incidents.map((i) =>
            i.id === incidentId ? { ...i, status: 'resolved' } : i,
          ),
        },
      }));
    };

    const setIsSimulating = (isSimulating) => {
      setState((prev) => ({ ...prev, isSimulating }));
    };

    storeRef.current = {
      getState,
      subscribe,
      setState,
      // Inject actions directly into state so they can be selected
      actions: {
        assignVolunteer,
        resolveTask,
        toggleEcoMode,
        resolveIncident,
        setIsSimulating,
      },
    };

    // Inject actions into initial state for easier selection
    state = {
      ...state,
      assignVolunteer,
      resolveTask,
      toggleEcoMode,
      resolveIncident,
      setIsSimulating,
    };
  }

  // Simulation engine
  useEffect(() => {
    const currentState = storeRef.current.getState();
    if (!currentState.isSimulating) return;
    if (!SIMULATION_VIEWS.has(activeView)) return;

    let interval = null;

    function startInterval() {
      interval = setInterval(() => {
        storeRef.current.setState((prev) => {
          if (!prev.isSimulating) return prev;
          const prevData = prev.contextData;
          const newGates = prevData.gates.map((gate) => {
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
            MIN_OCCUPANCY_SIMULATION,
            Math.min(
              prevData.stadium.capacity,
              prevData.stadium.currentOccupancy + Math.round((Math.random() - 0.5) * 200),
            ),
          );

          const newVendors = (prevData.vendors || []).map((vendor) => {
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
            if (
              !notificationCooldownRef.current[cooldownKey] ||
              now - notificationCooldownRef.current[cooldownKey] > 30000
            ) {
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
            contextData: {
              ...prevData,
              gates: newGates,
              stadium: { ...prevData.stadium, currentOccupancy: newOccupancy },
              vendors: newVendors,
            },
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

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stopInterval();
      } else {
        stopInterval();
        startInterval();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startInterval();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopInterval();
    };
  }, [activeView, addNotification]); // isSimulating is checked on tick

  return (
    <StadiumStoreContext.Provider value={storeRef.current}>{children}</StadiumStoreContext.Provider>
  );
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
