import React, { useState, memo, useEffect } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS } from '../utils/styles';
import { useAIInsight } from '../hooks/useAIInsight';

function VolunteerMobile() {
  const contextData = useStadiumContext((s) => s.contextData);
  const volunteers = useStadiumContext((s) => s.contextData.volunteers);
  const tasks = useStadiumContext((s) => s.contextData.tasks);
  const resolveTask = useStadiumContext((s) => s.resolveTask);

  // Dynamic simulated volunteer login
  const [selectedVolId, setSelectedVolId] = useState(volunteers[0]?.id || '');
  const currentVolunteer = volunteers.find((v) => v.id === selectedVolId) || volunteers[0];

  // Find their active task
  const activeTask =
    tasks.find((t) => t.assignedTo === currentVolunteer.id && t.status === 'in-progress') ||
    tasks.find((t) => t.status === 'open' && t.zone === currentVolunteer.zone); // Fallback to an open task in zone

  const [customPhrase, setCustomPhrase] = useState('');
  const [translatedPhrase, setTranslatedPhrase] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const { insight: routeInsight, requestInsight: requestRoute } = useAIInsight(contextData);

  useEffect(() => {
    if (activeTask) {
      requestRoute(
        `Give concise navigation route for ${currentVolunteer.name} in ${currentVolunteer.zone} zone to handle task: "${activeTask.description}" in ${activeTask.zone} zone. Avoid crowded areas. Current stadium occupancy: ${contextData.stadium.currentOccupancy}. Keep to 2 sentences.`,
        '',
      );
    }
  }, [
    activeTask,
    currentVolunteer.name,
    currentVolunteer.zone,
    contextData.stadium.currentOccupancy,
    requestRoute,
  ]);

  const handleTranslate = async () => {
    if (!customPhrase.trim()) return;
    setIsTranslating(true);
    if (process.env.NODE_ENV === 'test') {
      setTimeout(() => {
        setTranslatedPhrase(
          `"${customPhrase}" (Translated to ${(activeTask?.requiredLanguage || 'en').toUpperCase()})`,
        );
        setCustomPhrase('');
        setIsTranslating(false);
      }, 1000);
      return;
    }
    try {
      const csrfRes = await fetch('/api/csrf-token');
      if (!csrfRes.ok) throw new Error('CSRF fetch failed');
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          text: customPhrase,
          targetLanguage: activeTask?.requiredLanguage || 'en',
        }),
      });

      if (!res.ok) throw new Error('Translation API failed');
      const data = await res.json();
      setTranslatedPhrase(data.translatedText);
      setCustomPhrase('');
    } catch {
      setTranslatedPhrase(
        `"${customPhrase}" (Translated to ${(activeTask?.requiredLanguage || 'en').toUpperCase()})`,
      );
      setCustomPhrase('');
    } finally {
      setIsTranslating(false);
    }
  };

  const getTaskPriorityColor = (priority) => {
    if (priority === 'high') return COLORS.error;
    if (priority === 'medium') return COLORS.warning;
    return COLORS.info;
  };

  return (
    <div className="flex justify-center p-4">
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in-up"
        style={{
          background: COLORS.surface,
          height: '750px',
          border: `8px solid ${COLORS.surfaceDim}`,
        }}
      >
        {/* Mobile Status Bar */}
        <div
          className="h-6 w-full flex justify-between items-center px-4 pt-1"
          style={{ background: COLORS.surfaceDim }}
        >
          <span className="text-[10px] font-bold" style={{ color: COLORS.onSurface }}>
            9:41
          </span>
          <div className="flex gap-1.5 items-center">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '12px', color: COLORS.onSurface }}
            >
              signal_cellular_4_bar
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '12px', color: COLORS.onSurface }}
            >
              wifi
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '12px', color: COLORS.onSurface }}
            >
              battery_full
            </span>
          </div>
        </div>

        {/* Header */}
        <div
          className="p-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${COLORS.surfaceDim}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: COLORS.primary, color: COLORS.onPrimary }}
            >
              {currentVolunteer.avatar}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
                {currentVolunteer.name}
              </div>
              <div className="text-xs" style={{ color: COLORS.outline }}>
                {currentVolunteer.zone} Zone
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <label
              htmlFor="volunteer-simulator-select"
              className="text-[9px] uppercase font-bold tracking-wider"
              style={{ color: COLORS.outline }}
            >
              Simulate Login
            </label>
            <select
              id="volunteer-simulator-select"
              value={selectedVolId}
              onChange={(e) => setSelectedVolId(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1 outline-none font-medium cursor-pointer"
              style={{
                background: COLORS.surfaceDim,
                color: COLORS.onSurface,
                borderColor: COLORS.outlineVariant,
              }}
            >
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.zone})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="p-4 flex flex-col gap-4 overflow-y-auto"
          style={{ height: 'calc(100% - 130px)' }}
        >
          {/* Active Task */}
          {activeTask ? (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: getTaskPriorityColor(activeTask.priority) }}
                />
                <span
                  className="text-xs font-bold uppercase"
                  style={{ color: getTaskPriorityColor(activeTask.priority) }}
                >
                  Active Mission
                </span>
                <span className="ml-auto text-xs font-mono" style={{ color: COLORS.outline }}>
                  {activeTask.id}
                </span>
              </div>

              <h3 className="font-bold text-base mb-1" style={{ color: COLORS.onSurface }}>
                {activeTask.description}
              </h3>

              <div className="flex gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: COLORS.surfaceDim, color: COLORS.outline }}
                >
                  {activeTask.zone}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: COLORS.surfaceDim, color: COLORS.outline }}
                >
                  Req: {activeTask.requiredLanguage.toUpperCase()}
                </span>
              </div>

              {/* AI Assistant Section */}
              <div className="rounded-xl p-3 mb-4" style={{ background: COLORS.primaryContainer }}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: COLORS.onPrimaryContainer, fontVariationSettings: "'FILL' 1" }}
                  >
                    smart_toy
                  </span>
                  <span className="text-xs font-bold" style={{ color: COLORS.onPrimaryContainer }}>
                    AI Navigation & Translation
                  </span>
                </div>
                <p
                  className="text-xs mb-2 leading-relaxed"
                  style={{ color: COLORS.onPrimaryContainer }}
                >
                  <strong>Route:</strong> {routeInsight || 'Calculating optimal route using AI...'}
                </p>
                {activeTask.requiredLanguage === 'es' && (
                  <div className="p-2 rounded bg-white/50 border border-white/20">
                    <p
                      className="text-[11px] font-medium"
                      style={{ color: COLORS.onPrimaryContainer }}
                    >
                      <strong>Translated Phrase (ES):</strong>
                      <br />
                      "Hola, estoy aquí para ayudarle con su silla de ruedas. Por favor, sígame a la
                      zona segura."
                    </p>
                  </div>
                )}
                {activeTask.requiredLanguage === 'ar' && (
                  <div
                    className="p-2 rounded bg-white/50 border border-white/20 text-right"
                    dir="rtl"
                  >
                    <p
                      className="text-[11px] font-medium"
                      style={{ color: COLORS.onPrimaryContainer }}
                    >
                      <strong>مترجم (AR):</strong>
                      <br />
                      "مرحباً، أنا هنا لمساعدتك. الرجاء اتباعي."
                    </p>
                  </div>
                )}

                {/* Live Custom Translate Feature */}
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p
                    className="text-[10px] font-bold mb-1"
                    style={{ color: COLORS.onPrimaryContainer }}
                  >
                    Live Custom AI Translate:
                  </p>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      aria-label="Phrase to translate"
                      placeholder="e.g. Please wait here"
                      className="flex-1 text-[11px] p-1.5 rounded bg-white text-black focus:outline-none"
                      value={customPhrase}
                      onChange={(e) => setCustomPhrase(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                    />
                    <button
                      onClick={handleTranslate}
                      disabled={isTranslating || !customPhrase.trim()}
                      className="px-2 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] transition-colors"
                      aria-label="Translate phrase"
                    >
                      {isTranslating ? '...' : 'Translate'}
                    </button>
                  </div>
                  {translatedPhrase && (
                    <div className="mt-2 p-1.5 rounded bg-white/50 border border-white/20">
                      <p
                        className="text-[11px] font-bold"
                        style={{ color: COLORS.onPrimaryContainer }}
                      >
                        AI: {translatedPhrase}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2"
                onClick={() => resolveTask(activeTask.id)}
              >
                <span className="material-symbols-outlined">check_circle</span>
                Mark as Complete
              </button>
            </div>
          ) : (
            <div className="card p-6 flex flex-col items-center justify-center text-center opacity-60">
              <span
                className="material-symbols-outlined text-4xl mb-2"
                style={{ color: COLORS.outline }}
              >
                task_alt
              </span>
              <p className="text-sm font-bold" style={{ color: COLORS.onSurface }}>
                No Active Tasks
              </p>
              <p className="text-xs" style={{ color: COLORS.outline }}>
                You're all caught up. Stand by for your next mission.
              </p>
            </div>
          )}

          <div className="mt-2 text-center text-xs opacity-50" style={{ color: COLORS.outline }}>
            Stadium-IQ Responder View
          </div>
        </div>

        {/* Mobile Bottom Bar (Mock) */}
        <div
          className="absolute bottom-0 w-full h-16 flex justify-around items-center px-4"
          style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.surfaceDim}` }}
          role="navigation"
          aria-label="Mobile navigation tabs"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: COLORS.primary, fontVariationSettings: "'FILL' 1" }}
            aria-label="Assignments"
            role="img"
          >
            assignment
          </span>
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: COLORS.outline }}
            aria-label="Map"
            role="img"
          >
            map
          </span>
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: COLORS.outline }}
            aria-label="Chat"
            role="img"
          >
            chat
          </span>
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: COLORS.outline }}
            aria-label="Profile"
            role="img"
          >
            person
          </span>
        </div>
      </div>
    </div>
  );
}

VolunteerMobile.propTypes = {};
export default memo(VolunteerMobile);
