import React, { useEffect, useState, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Screen Reader Route Change Announcer
 * SPAs often fail to notify screen readers when a "page" navigation occurs.
 * This component visually hides an aria-live region and dynamically updates it.
 */
const viewTitles = {
  command: 'Command Center',
  ai: 'GenAI Assistant',
  crowd: 'Crowd & Navigation',
  volunteers: 'Volunteer Dispatch',
  transport: 'Transport Hub',
  sustain: 'Sustainability Dashboard',
  accessibility: 'Accessibility Hub',
  vendor: 'Vendor Dashboard',
  volunteer_mobile: 'Volunteer Mobile View',
};

const Announcer = ({ activeView }) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const title = viewTitles[activeView] || 'Page';
    // Delay slightly so focus changes don't interrupt the announcement
    const timeout = setTimeout(() => {
      setMessage(`Navigated to ${title}`);
    }, 500);
    return () => clearTimeout(timeout);
  }, [activeView]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="route-announcer"
    >
      {message}
    </div>
  );
};

Announcer.propTypes = {
  activeView: PropTypes.string.isRequired,
};

export default memo(Announcer);
