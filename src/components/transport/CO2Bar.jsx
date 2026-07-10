import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { getCO2Color } from '../../utils/helpers';

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

CO2Bar.propTypes = {
  co2e: PropTypes.number.isRequired,
  maxCo2: PropTypes.number,
};

export default CO2Bar;
