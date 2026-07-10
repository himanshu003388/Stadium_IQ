import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../../utils/styles';

const DonutChart = memo(function DonutChart({
  percentage,
  color,
  size = 120,
  strokeWidth = 14,
  label,
  sublabel,
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - percentage / 100);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="flex flex-col items-center gap-1"
      role="img"
      aria-label={`${label || 'Chart'}: ${percentage}%`}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          {label && (
            <title>
              {label} - {percentage}%
            </title>
          )}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={COLORS.outlineVariant}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div className="text-xl font-bold" style={{ color }}>
            {percentage}%
          </div>
        </div>
      </div>
      {label && (
        <div
          className="text-xs font-semibold text-center"
          style={{ color: COLORS.onSurfaceVariant }}
        >
          {label}
        </div>
      )}
      {sublabel && (
        <div className="text-xs text-center" style={{ color: COLORS.outline }}>
          {sublabel}
        </div>
      )}
    </div>
  );
});

DonutChart.propTypes = {
  percentage: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  label: PropTypes.string,
  sublabel: PropTypes.string,
};

export default DonutChart;
