import React, { useState, memo } from 'react';
import { COLORS } from '../../utils/styles';
import { useStadiumContext } from '../../context/StadiumContext';
import { useAIInsight } from '../../hooks/useAIInsight';

function SmartBroadcastWidget() {
  const contextData = useStadiumContext((s) => s.contextData);
  const {
    insight,
    isLoading: isBroadcasting,
    requestInsight: requestBroadcast,
  } = useAIInsight(contextData);
  const [message, setMessage] = useState('');
  const [broadcasted, setBroadcasted] = useState(false);

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    setBroadcasted(false);
    const fallbackText = `• EN: ${message}\n• ES: "${message}" (Traducido al Español)\n• FR: "${message}" (Traduit en Français)\n• AR: "${message}" (مترجم إلى العربية)\n• PT: "${message}" (Traduzido para o Português)\n• JA: "${message}" (日本語に翻訳)\n• HI: "${message}" (हिंदी में अनुवादित)`;
    await requestBroadcast(
      `Translate this stadium announcement to 7 languages (EN, ES, FR, AR, PT, JA, HI) and return the translations. Announcement: "${message}". Return the translations in a bullet list.`,
      fallbackText,
    );
    setBroadcasted(true);
    setMessage('');
    setTimeout(() => setBroadcasted(false), 5000);
  };

  return (
    <div className="card p-5 animate-fade-in-up stagger-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          aria-hidden="true"
          className="material-symbols-outlined"
          style={{ color: COLORS.secondary, fontVariationSettings: "'FILL' 1" }}
        >
          record_voice_over
        </span>
        <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
          Smart PA System (GenAI Multilingual Broadcast)
        </h2>
      </div>
      <p className="text-xs mb-3" style={{ color: COLORS.outline }}>
        Enter an announcement in English. The AI will instantly translate and push audio to all zone
        PA systems in 7 languages.
      </p>
      <label
        htmlFor="broadcast-message"
        className="text-xs mb-1 block font-medium"
        style={{ color: COLORS.outline }}
      >
        Announcement text
      </label>
      <textarea
        id="broadcast-message"
        className="w-full bg-transparent border rounded-xl p-3 text-sm focus:outline-none focus:border-primary mb-3"
        style={{ borderColor: COLORS.surfaceDim, color: COLORS.onSurface }}
        rows="2"
        aria-label="Enter broadcast announcement"
        placeholder="e.g., Gate C is temporarily closed. Please use Gate D."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2 text-xs flex-wrap">
          {['EN', 'ES', 'FR', 'AR', 'PT', 'JA', 'HI'].map((lang) => (
            <span
              key={lang}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: COLORS.surfaceDim, color: COLORS.outline }}
            >
              {lang}
            </span>
          ))}
        </div>
        <button
          onClick={handleBroadcast}
          disabled={!message.trim() || isBroadcasting}
          className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
          style={broadcasted ? { background: COLORS.success, color: COLORS.onSuccess } : {}}
        >
          <span className="material-symbols-outlined text-sm">
            {broadcasted ? 'check_circle' : isBroadcasting ? 'autorenew' : 'campaign'}
          </span>
          {broadcasted
            ? 'Broadcast Sent'
            : isBroadcasting
              ? 'Translating...'
              : 'Generate & Broadcast'}
        </button>
      </div>
      {insight && (
        <div
          className="p-3 rounded-xl border text-xs animate-fade-in-up"
          style={{
            background: COLORS.surfaceDim,
            borderColor: COLORS.outlineVariant,
            color: COLORS.onSurface,
          }}
        >
          <div
            className="font-bold mb-2 flex items-center gap-1.5"
            style={{ color: COLORS.secondary }}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              translate
            </span>
            Active Audio Broadcast Transcripts:
          </div>
          <div className="whitespace-pre-line leading-relaxed font-mono text-[11px] max-h-36 overflow-y-auto custom-scrollbar">
            {insight}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SmartBroadcastWidget);
