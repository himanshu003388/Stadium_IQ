import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../../utils/styles';
import { INCIDENT_ICON_MAP } from '../../utils/constants';
import { timeAgo, getSeverityColor } from '../../utils/helpers';
import { useNotifications } from '../../context/NotificationContext';
import SeverityBadge from './SeverityBadge';

function IncidentCard({ incident, onResolve }) {
  const { addNotification } = useNotifications();
  const severityColor = getSeverityColor(incident.severity);
  const severityBg =
    incident.severity === 'critical'
      ? 'var(--color-error-container)'
      : incident.severity === 'medium'
        ? 'var(--color-warning-container)'
        : 'var(--color-info-container)';

  return (
    <div
      className={`card p-4 animate-fade-in-up border-l-4 ${incident.status === 'resolved' ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: severityColor }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: severityBg }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-xl"
            style={{ color: severityColor, fontVariationSettings: "'FILL' 1" }}
          >
            {INCIDENT_ICON_MAP[incident.type] || 'warning'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono font-bold" style={{ color: COLORS.outline }}>
              {incident.id}
            </span>
            <SeverityBadge severity={incident.severity} />
            {incident.status === 'resolved' && <span className="badge-success">Resolved</span>}
            <span className="text-xs ml-auto" style={{ color: COLORS.onSurfaceVariant }}>
              {timeAgo(incident.timestamp)}
            </span>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: COLORS.onSurface }}>
            {incident.description}
          </p>
          <div
            className="flex items-start gap-1.5 p-2 rounded-lg"
            style={{ background: COLORS.surface }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-sm shrink-0 mt-0.5"
              style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              smart_toy
            </span>
            <p className="text-xs" style={{ color: COLORS.onSurfaceVariant }}>
              <span className="font-semibold" style={{ color: COLORS.primaryContainer }}>
                AI Action:{' '}
              </span>
              {incident.aiRecommendedAction}
            </p>
          </div>
        </div>
      </div>
      {incident.status === 'active' && (
        <div
          className="mt-3 flex justify-between items-center flex-wrap gap-2 pt-3 border-t border-dashed"
          style={{ borderColor: COLORS.outlineVariant }}
        >
          <div className="flex gap-2">
            <button
              onClick={() => {
                addNotification({
                  title: 'Medical Dispatched',
                  message: `Rapid response medical unit dispatched to zone matching ${incident.id}.`,
                  severity: 'critical',
                });
              }}
              className="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors hover:opacity-90"
              style={{ background: COLORS.errorContainer, color: COLORS.onErrorContainer }}
              aria-label="Dispatch Medical Team"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xs">
                medical_services
              </span>
              Dispatch Medical
            </button>
            <button
              onClick={() => {
                addNotification({
                  title: 'Security Dispatched',
                  message: `Security patrol squad routed to secure area around ${incident.id}.`,
                  severity: 'medium',
                });
              }}
              className="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors hover:opacity-90"
              style={{ background: COLORS.infoContainer, color: COLORS.info }}
              aria-label="Dispatch Security Team"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xs">
                local_police
              </span>
              Alert Security
            </button>
          </div>
          <button
            className="btn-ghost text-xs py-1.5 px-3 cursor-pointer"
            onClick={() => onResolve(incident.id)}
            aria-label={`Mark incident ${incident.id} as resolved`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              check_circle
            </span>
            Mark Resolved
          </button>
        </div>
      )}
    </div>
  );
}

IncidentCard.propTypes = {
  incident: PropTypes.shape({
    id: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date).isRequired,
    description: PropTypes.string.isRequired,
    aiRecommendedAction: PropTypes.string,
  }).isRequired,
  onResolve: PropTypes.func.isRequired,
};

export default memo(IncidentCard);
