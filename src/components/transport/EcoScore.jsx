import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { ECO_SCORE_THRESHOLDS } from '../../utils/constants';

const EcoScore = memo(function EcoScore({ co2e }) {
  if (co2e === ECO_SCORE_THRESHOLDS.zero)
    return <span className="badge-success">Zero Emission</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.low) return <span className="badge-success">Eco ♻️</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.moderate) return <span className="badge-info">Low CO₂</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.high) return <span className="badge-warning">Moderate</span>;
  return <span className="badge-critical">High CO₂</span>;
});

EcoScore.propTypes = {
  co2e: PropTypes.number.isRequired,
};

export default EcoScore;
