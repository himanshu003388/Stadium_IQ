import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { SEVERITY_BADGE_MAP } from '../../utils/constants';

function SeverityBadge({ severity }) {
  return <span className={SEVERITY_BADGE_MAP[severity] || 'badge-info'}>{severity}</span>;
}

SeverityBadge.propTypes = { severity: PropTypes.string.isRequired };

export default memo(SeverityBadge);
