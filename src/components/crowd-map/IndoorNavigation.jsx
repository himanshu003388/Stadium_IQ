import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../../utils/styles';

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

function IndoorNavigation({ gateId, onClose }) {
  return (
    <div
      className="card p-4 animate-fade-in-up"
      style={{ border: `1px solid ${COLORS.outlineVariant}` }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ color: COLORS.secondary }}>
            explore
          </span>
          <h4 className="font-bold text-xs" style={{ color: COLORS.onSurface }}>
            Indoor Navigation from Gate {gateId}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold cursor-pointer"
          style={{ color: COLORS.outline }}
          aria-label="Close indoor navigation"
        >
          X
        </button>
      </div>
      <div
        className="flex flex-col gap-3 font-mono text-[11px]"
        style={{ color: COLORS.onSurfaceVariant }}
      >
        {INDOOR_ROUTES[gateId]?.map((step) => (
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
  );
}

IndoorNavigation.propTypes = {
  gateId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default memo(IndoorNavigation);
