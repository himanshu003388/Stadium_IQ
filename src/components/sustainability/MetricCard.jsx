import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../../utils/styles';

const MetricCard = memo(function MetricCard({ icon, label, value, unit, sub, color, bg, delay }) {
  return (
    <div
      className={`card p-5 animate-fade-in-up stagger-${delay}`}
      role="figure"
      aria-label={`${label}: ${value}${unit || ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-label-sm mb-1" style={{ color: COLORS.outline }}>
            {label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-metric-lg" style={{ color }}>
              {value}
            </span>
            {unit && (
              <span className="text-sm font-semibold" style={{ color: COLORS.onSurfaceVariant }}>
                {unit}
              </span>
            )}
          </div>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: bg }}
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
      {sub && (
        <p className="text-xs" style={{ color: COLORS.outline }}>
          {sub}
        </p>
      )}
    </div>
  );
});

MetricCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  sub: PropTypes.string,
  color: PropTypes.string.isRequired,
  bg: PropTypes.string.isRequired,
  delay: PropTypes.number,
};

export default MetricCard;
