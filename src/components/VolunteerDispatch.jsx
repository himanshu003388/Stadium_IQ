import React, { useState, useMemo, useCallback, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, PRIORITY_COLORS, PRIORITY_BG, LANG_FLAGS } from '../utils/styles';
import { getLoadBarColor } from '../utils/helpers';

const VOLUNTEER_STATUS_COLORS = {
  available: 'var(--color-status-nominal)',
  busy: 'var(--color-status-critical)',
  default: 'var(--color-status-busy)',
};

/**
 * Load bar showing current vs max capacity with color-coded fill.
 * @param {{ current: number, max: number }} props
 */
const LoadBar = memo(function LoadBar({ current, max }) {
  const pct = Math.round((current / max) * 100);
  const color = getLoadBarColor(current, max);
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Load ${current} out of ${max}`}
    >
      <div className="density-bar flex-1" style={{ height: '5px' }}>
        <div className="density-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span
        className="text-xs font-mono font-bold shrink-0"
        style={{ color, width: '32px', textAlign: 'right' }}
      >
        {current}/{max}
      </span>
    </div>
  );
});

/**
 * Volunteer card displaying name, zone, load, languages and skills.
 * @param {{ vol: object }} props
 */
const VolunteerCard = memo(function VolunteerCard({ vol }) {
  const statusColor = VOLUNTEER_STATUS_COLORS[vol.status] || VOLUNTEER_STATUS_COLORS.default;
  return (
    <div
      className="card p-4 flex flex-col gap-2"
      role="listitem"
      aria-label={`Volunteer ${vol.name}, ${vol.status}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{ background: COLORS.gradientNavy }}
        >
          {vol.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate" style={{ color: COLORS.onSurface }}>
              {vol.name}
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: statusColor }}
              role="status"
              aria-label={`Status: ${vol.status}`}
            />
          </div>
          <div className="text-xs" style={{ color: COLORS.outline }}>
            Zone: {vol.zone}
          </div>
        </div>
      </div>
      <LoadBar current={vol.currentLoad} max={vol.maxLoad} />
      <div className="flex flex-wrap gap-1">
        {vol.languages.map((l) => (
          <span
            key={l}
            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{ background: COLORS.surface, color: COLORS.onSurfaceVariant }}
          >
            {LANG_FLAGS[l]} {l.toUpperCase()}
          </span>
        ))}
        {vol.skills.map((s) => (
          <span
            key={s}
            className="text-xs px-1.5 py-0.5 rounded-md"
            style={{ background: COLORS.infoContainer, color: COLORS.info }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
});

/**
 * Task card with priority, AI suggestion, assign and resolve actions.
 * @param {{ task: object, volunteers: Array, onAssign: Function, onResolve: Function }} props
 */
const TaskCard = memo(function TaskCard({ task, volunteers, onAssign, onResolve }) {
  const [assigning, setAssigning] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const assignedVol = useMemo(
    () => volunteers.find((v) => v.id === task.assignedTo),
    [volunteers, task.assignedTo],
  );

  const eligibleVols = useMemo(
    () =>
      volunteers.filter(
        (v) =>
          v.languages.includes(task.requiredLanguage) &&
          v.skills.includes(task.requiredSkill) &&
          v.currentLoad < v.maxLoad &&
          v.status !== 'busy',
      ),
    [volunteers, task.requiredLanguage, task.requiredSkill],
  );

  const suggestBestVolunteer = useCallback(async () => {
    setAssigning(true);
    try {
      const csrfRes = await fetch('/api/csrf-token');
      if (!csrfRes.ok) throw new Error('CSRF fetch failed');
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/ai/volunteer-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ task, volunteers }),
      });

      if (!res.ok) throw new Error('API dispatch failed');
      const data = await res.json();
      if (data.suggestion) {
        const found = volunteers.find((v) => v.id === data.suggestion.volunteerId);
        if (found) {
          setAiSuggestion({ ...found, customReason: data.suggestion.reason });
          setAssigning(false);
          return;
        }
      }
      throw new Error('No suggestions returned');
    } catch (err) {
      const best = eligibleVols.toSorted((a, b) => a.currentLoad - b.currentLoad)[0];
      setAiSuggestion(best ? { ...best, customReason: `${best.name} matches required skill (${task.requiredSkill}) and language (fallback).` } : null);
    } finally {
      setAssigning(false);
    }
  }, [task, volunteers, eligibleVols]);

  return (
    <div
      className={`card p-4 border-l-4 animate-fade-in-up ${task.status === 'resolved' ? 'opacity-50' : ''}`}
      style={{ borderLeftColor: PRIORITY_COLORS[task.priority] }}
      role="listitem"
      aria-label={`Task ${task.id}: ${task.priority} priority, ${task.status}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold" style={{ color: COLORS.outline }}>
              {task.id}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
              style={{
                background: PRIORITY_BG[task.priority],
                color: PRIORITY_COLORS[task.priority],
              }}
            >
              {task.priority}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: COLORS.surface, color: COLORS.onSurfaceVariant }}
            >
              {task.zone} Zone
            </span>
            {task.status === 'resolved' && <span className="badge-success">Done</span>}
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: COLORS.onSurface }}>
            {task.description}
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.outline }}>
            <span>
              {LANG_FLAGS[task.requiredLanguage]} {task.requiredLanguage.toUpperCase()}
            </span>
            <span>·</span>
            <span>{task.requiredSkill}</span>
          </div>
        </div>
      </div>

      {/* Assigned */}
      {assignedVol && task.status !== 'resolved' && (
        <div
          className="flex items-center gap-2 mb-2 p-2 rounded-lg"
          style={{ background: COLORS.successContainer }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-sm"
            style={{ color: COLORS.success, fontVariationSettings: "'FILL' 1" }}
          >
            person_check
          </span>
          <span className="text-xs font-medium" style={{ color: COLORS.success }}>
            Assigned to {assignedVol.name}
          </span>
          <button
            onClick={() => onResolve(task.id)}
            className="btn-ghost text-xs py-1 px-2 ml-auto"
            aria-label="Mark task as completed"
          >
            Complete
          </button>
        </div>
      )}

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div
          className="flex items-start gap-2 mb-2 p-3 rounded-lg animate-fade-in-up flex-col sm:flex-row"
          style={{ background: COLORS.primaryFixed, border: `1px solid ${COLORS.outlineVariant}` }}
        >
          <div className="flex items-start gap-2 flex-1">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-sm shrink-0 mt-0.5"
              style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              smart_toy
            </span>
            <div className="text-xs" style={{ color: COLORS.primaryContainer }}>
              <div>
                <span className="font-semibold">AI Suggests: </span>
                {aiSuggestion.name} — {aiSuggestion.currentLoad}/{aiSuggestion.maxLoad} tasks, speaks{' '}
                {aiSuggestion.languages.join(', ').toUpperCase()}
              </div>
              {aiSuggestion.customReason && (
                <p className="mt-1 opacity-90 italic leading-relaxed text-[11px]">
                  💡 {aiSuggestion.customReason}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              onAssign(task.id, aiSuggestion.id);
              setAiSuggestion(null);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 w-full sm:w-auto"
            style={{ background: COLORS.primaryContainer, color: COLORS.onPrimary }}
            aria-label={`Assign to ${aiSuggestion.name}`}
          >
            Assign
          </button>
        </div>
      )}

      {/* Actions */}
      {task.status === 'open' && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={suggestBestVolunteer}
            disabled={assigning || eligibleVols.length === 0}
            className="btn-primary text-xs py-1.5 px-3"
            aria-label="Assign task to best available volunteer"
          >
            {assigning ? (
              <>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-sm animate-spin-slow"
                >
                  refresh
                </span>{' '}
                Analyzing…
              </>
            ) : (
              <>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  smart_toy
                </span>{' '}
                AI Assign
              </>
            )}
          </button>
          {eligibleVols.length === 0 && (
            <span className="text-xs flex items-center" style={{ color: COLORS.error }}>
              <span aria-hidden="true" className="material-symbols-outlined text-sm mr-1">
                warning
              </span>
              No eligible volunteers
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Volunteer Dispatch panel — AI-powered task assignment and volunteer roster.
 */
function VolunteerDispatch() {
  const { contextData, assignVolunteer, resolveTask } = useStadiumContext();
  const { volunteers, tasks } = contextData;

  const openTasks = useMemo(() => tasks.filter((t) => t.status === 'open'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === 'in-progress'), [tasks]);
  const resolvedTasks = useMemo(() => tasks.filter((t) => t.status === 'resolved'), [tasks]);
  const availableVols = useMemo(
    () => volunteers.filter((v) => v.currentLoad < v.maxLoad && v.status !== 'busy'),
    [volunteers],
  );

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5" role="region" aria-label="Volunteer Dispatch">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
            Volunteer Dispatch
          </h2>
          <p className="text-sm" style={{ color: COLORS.outline }}>
            AI-powered task assignment & volunteer management
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-center card px-4 py-2">
            <div className="text-xl font-bold" style={{ color: COLORS.error }}>
              {openTasks.length}
            </div>
            <div className="text-xs" style={{ color: COLORS.outline }}>
              Open Tasks
            </div>
          </div>
          <div className="text-center card px-4 py-2">
            <div className="text-xl font-bold" style={{ color: COLORS.success }}>
              {availableVols.length}
            </div>
            <div className="text-xs" style={{ color: COLORS.outline }}>
              Available
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Task Board */}
        <div className="flex flex-col gap-4" role="list" aria-label="Task board">
          {/* Open */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-critical">{openTasks.length} Open</span>
              <span className="text-sm font-semibold" style={{ color: COLORS.onSurface }}>
                Tasks requiring assignment
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {openTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  volunteers={volunteers}
                  onAssign={assignVolunteer}
                  onResolve={resolveTask}
                />
              ))}
              {openTasks.length === 0 && (
                <div className="card p-6 text-center" style={{ color: COLORS.outline }}>
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-3xl mb-2 block"
                    style={{ color: COLORS.success, fontVariationSettings: "'FILL' 1" }}
                  >
                    task_alt
                  </span>
                  All tasks assigned!
                </div>
              )}
            </div>
          </div>

          {/* In Progress */}
          {inProgressTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-warning">{inProgressTasks.length} In Progress</span>
              </div>
              <div className="flex flex-col gap-3">
                {inProgressTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    volunteers={volunteers}
                    onAssign={assignVolunteer}
                    onResolve={resolveTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolvedTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-success">{resolvedTasks.length} Resolved</span>
              </div>
              <div className="flex flex-col gap-3">
                {resolvedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    volunteers={volunteers}
                    onAssign={assignVolunteer}
                    onResolve={resolveTask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Volunteer Roster */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
            >
              badge
            </span>
            <span className="text-sm font-semibold" style={{ color: COLORS.onSurface }}>
              Volunteer Roster
            </span>
            <span className="text-xs ml-auto" style={{ color: COLORS.outline }}>
              {volunteers.length} total
            </span>
          </div>
          {/* Volunteer roster \u2014 bounded height prevents layout issues with large rosters */}
          <div
            className="flex flex-col gap-3 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: '480px' }}
            role="list"
            aria-label="Volunteer roster"
          >
            {volunteers.map((vol) => (
              <VolunteerCard key={vol.id} vol={vol} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(VolunteerDispatch);
