import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../../utils/styles';

const ProgressBar = memo(function ProgressBar({ label, value, max, color, unit }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: COLORS.onSurfaceVariant }} className="font-medium">
          {label}
        </span>
        <span className="font-mono font-bold" style={{ color }}>
          {value}
          {unit}{' '}
          <span style={{ color: COLORS.outline, fontWeight: 400 }}>
            / {max}
            {unit}
          </span>
        </span>
      </div>
      <div
        className="density-bar"
        style={{ height: '8px' }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${value}${unit || ''} out of ${max}${unit || ''}`}
      >
        <div
          className="density-fill"
          style={{ width: `${pct}%`, background: color, borderRadius: '4px' }}
        />
      </div>
    </div>
  );
});

ProgressBar.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  unit: PropTypes.string,
};

export default ProgressBar;
