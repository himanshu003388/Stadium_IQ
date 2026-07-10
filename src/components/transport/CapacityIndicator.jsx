import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { getCapacityColor } from '../../utils/helpers';

const CapacityIndicator = memo(function CapacityIndicator({ left }) {
  const color = getCapacityColor(left);
  return (
    <span
      className="text-xs font-medium"
      style={{ color }}
      role="status"
      aria-live="polite"
      aria-label={`${left} seats left`}
    >
      {left <= 5 ? '⚠️' : '✓'} {left} seats left
    </span>
  );
});

CapacityIndicator.propTypes = {
  left: PropTypes.number.isRequired,
};

export default CapacityIndicator;
