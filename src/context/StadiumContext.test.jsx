/**
 * StadiumContext Tests
 * Tests simulation tick, all context actions, and visibility-based pausing
 */
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StadiumProvider, useStadiumData } from './StadiumContext';

function ContextConsumer({ onData }) {
  const data = useStadiumData();
  onData(data);
  return (
    <div>
      <span data-testid="occupancy">{data.contextData.stadium.currentOccupancy}</span>
      <span data-testid="simulating">{data.isSimulating ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('StadiumContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('provides initial context data', () => {
    const ref = { current: null };
    render(
      <StadiumProvider>
        <ContextConsumer
          onData={(d) => {
            ref.current = d;
          }}
        />
      </StadiumProvider>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current.contextData.stadium).toBeDefined();
    expect(ref.current.contextData.gates).toBeDefined();
    expect(ref.current.contextData.incidents).toBeDefined();
  });

  it('isSimulating starts as true', () => {
    render(
      <StadiumProvider>
        <ContextConsumer onData={() => {}} />
      </StadiumProvider>,
    );
    expect(screen.getByTestId('simulating').textContent).toBe('yes');
  });

  it('simulation tick updates gate density after 8 seconds', async () => {
    const ref = { current: null };
    render(
      <StadiumProvider>
        <ContextConsumer
          onData={(d) => {
            ref.current = d;
          }}
        />
      </StadiumProvider>,
    );

    const initialDensities = ref.current.contextData.gates.map((g) => g.density);

    await act(async () => {
      vi.advanceTimersByTime(8001);
    });

    const newDensities = ref.current.contextData.gates.map((g) => g.density);
    // At least one gate density should have changed
    const changed = newDensities.some((d, i) => d !== initialDensities[i]);
    expect(changed).toBe(true);
  });

  it('resolveIncident marks incident as resolved', () => {
    const ref = { current: null };
    render(
      <StadiumProvider>
        <ContextConsumer
          onData={(d) => {
            ref.current = d;
          }}
        />
      </StadiumProvider>,
    );

    const firstActiveIncident = ref.current.contextData.incidents.find(
      (i) => i.status === 'active',
    );
    if (firstActiveIncident) {
      act(() => {
        ref.current.resolveIncident(firstActiveIncident.id);
      });
      const resolved = ref.current.contextData.incidents.find(
        (i) => i.id === firstActiveIncident.id,
      );
      expect(resolved.status).toBe('resolved');
    }
  });

  it('toggleEcoMode toggles ecoModeActive', () => {
    const ref = { current: null };
    render(
      <StadiumProvider>
        <ContextConsumer
          onData={(d) => {
            ref.current = d;
          }}
        />
      </StadiumProvider>,
    );

    const initialEco = ref.current.contextData.stadium.sustainability.ecoModeActive;
    act(() => {
      ref.current.toggleEcoMode();
    });
    expect(ref.current.contextData.stadium.sustainability.ecoModeActive).toBe(!initialEco);

    // Toggle back
    act(() => {
      ref.current.toggleEcoMode();
    });
    expect(ref.current.contextData.stadium.sustainability.ecoModeActive).toBe(initialEco);
  });

  it('assignVolunteer updates task and volunteer', () => {
    const ref = { current: null };
    render(
      <StadiumProvider>
        <ContextConsumer
          onData={(d) => {
            ref.current = d;
          }}
        />
      </StadiumProvider>,
    );

    const openTask = ref.current.contextData.tasks.find((t) => t.status === 'open');
    const availableVol = ref.current.contextData.volunteers.find((v) => v.status === 'available');

    if (openTask && availableVol) {
      const prevLoad = availableVol.currentLoad;
      act(() => {
        ref.current.assignVolunteer(openTask.id, availableVol.id);
      });
      const updatedTask = ref.current.contextData.tasks.find((t) => t.id === openTask.id);
      const updatedVol = ref.current.contextData.volunteers.find((v) => v.id === availableVol.id);
      expect(updatedTask.status).toBe('in-progress');
      expect(updatedTask.assignedTo).toBe(availableVol.id);
      expect(updatedVol.currentLoad).toBe(prevLoad + 1);
    }
  });

  it('setIsSimulating stops the simulation', async () => {
    const ref = { current: null };
    render(
      <StadiumProvider>
        <ContextConsumer
          onData={(d) => {
            ref.current = d;
          }}
        />
      </StadiumProvider>,
    );

    act(() => {
      ref.current.setIsSimulating(false);
    });

    const densityBefore = ref.current.contextData.gates.map((g) => g.density);
    await act(async () => {
      vi.advanceTimersByTime(8001);
    });
    const densityAfter = ref.current.contextData.gates.map((g) => g.density);
    // No change expected since simulation is stopped
    expect(densityBefore).toEqual(densityAfter);
  });

  it('throws if useStadiumData is used outside StadiumProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<ContextConsumer onData={() => {}} />);
    }).toThrow('useStadiumContext must be used within a StadiumProvider');
    consoleError.mockRestore();
  });
});
