/**
 * Header Component - Stadium IQ Top Bar
 * Shows match score, AI status, incident alerts, and live clock
 * @component
 */
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useStadiumContext } from '../context/StadiumContext';
import { useAppContext } from '../context/AppContext';
import { COLORS } from '../utils/styles';

/**
 * Match clock simulation
 */
/**
 * Starting match time for the simulation — mid-second-half for a dramatic
 * demo feel where incidents and crowd dynamics are at their peak.
 */
const INITIAL_MATCH_TIME = "67'";

function useMatchClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [matchTime, setMatchTime] = useState(INITIAL_MATCH_TIME);

  useEffect(() => {
    const tick = setInterval(() => {
      setCurrentTime(new Date());
      setMatchTime((prev) => {
        const mins = parseInt(prev, 10);
        if (mins < 90) return `${mins + 1}'`;
        if (mins < 120) return `${mins + 1}' +`;
        return "90'";
      });
    }, 60000);
    return () => clearInterval(tick);
  }, []);

  return { currentTime, matchTime };
}

/**
 * Custom Styled Role Selector Dropdown with full keyboard focus management.
 * Supports: Escape to close, focus trap within list, focus return to trigger.
 */
function RoleSelector({ role, setRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus first list item when dropdown opens
  useEffect(() => {
    if (isOpen && listRef.current) {
      const firstBtn = listRef.current.querySelector('button');
      firstBtn?.focus();
    }
  }, [isOpen]);

  /**
   * Handle keyboard events on the dropdown listbox.
   * Escape → close & return focus to trigger
   * Tab / Shift+Tab → cycle within listbox (focus trap)
   * @param {React.KeyboardEvent} e
   */
  const handleListKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    const focusable = Array.from(listRef.current?.querySelectorAll('button') ?? []);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currIdx = focusable.indexOf(document.activeElement);
      const nextIdx = (currIdx + 1) % focusable.length;
      focusable[nextIdx].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currIdx = focusable.indexOf(document.activeElement);
      const prevIdx = (currIdx - 1 + focusable.length) % focusable.length;
      focusable[prevIdx].focus();
    }
  };

  const roles = [
    { value: 'Organizer', icon: 'shield_person' },
    { value: 'Staff', icon: 'badge' },
    { value: 'Volunteer', icon: 'volunteer_activism' },
    { value: 'Fan', icon: 'sports_soccer' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 outline-none font-medium cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#3b82f6]"
        style={{
          background: isOpen
            ? 'color-mix(in srgb, var(--color-header-text) 15%, transparent)'
            : 'color-mix(in srgb, var(--color-header-text) 8%, transparent)',
          color: 'var(--color-header-text)',
          border: '1px solid color-mix(in srgb, var(--color-header-text) 20%, transparent)',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select User Role, currently ${role}`}
      >
        <span
          className="material-symbols-outlined text-base"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {roles.find((r) => r.value.toLowerCase() === role.toLowerCase())?.icon || 'person'}
        </span>
        {role.charAt(0).toUpperCase() + role.slice(1)}
        <span
          className="material-symbols-outlined text-base transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50 animate-fade-in-up"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: '0 8px 32px var(--shadow-base)',
          }}
          role="listbox"
          aria-label="Select user role"
          onKeyDown={handleListKeyDown}
        >
          {roles.map((r) => (
            <li key={r.value}>
              <button
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  color:
                    role.toLowerCase() === r.value.toLowerCase()
                      ? 'var(--color-primary)'
                      : 'var(--color-on-surface)',
                  background:
                    role.toLowerCase() === r.value.toLowerCase()
                      ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                      : 'transparent',
                  fontWeight: role.toLowerCase() === r.value.toLowerCase() ? '600' : '500',
                }}
                onClick={() => {
                  setRole(r.value.toLowerCase());
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                role="option"
                aria-selected={role.toLowerCase() === r.value.toLowerCase()}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{
                    fontVariationSettings:
                      role.toLowerCase() === r.value.toLowerCase() ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {r.icon}
                </span>
                {r.value}
                {role.toLowerCase() === r.value.toLowerCase() && (
                  <span className="material-symbols-outlined text-lg ml-auto">check</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Header component
 * @param {object} props - Component props
 * @param {function} props.setActiveView - View navigation callback
 * @returns {React.ReactElement}
 */
function Header({ setActiveView }) {
  const stadium = useStadiumContext((s) => s.contextData.stadium);
  const incidents = useStadiumContext((s) => s.contextData.incidents);
  const { theme, toggleTheme, role, setRole, geminiActive } = useAppContext();
  const { currentTime, matchTime } = useMatchClock();

  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status === 'active').length,
    [incidents],
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-[color-mix(in_srgb,var(--color-header-text)_10%,transparent)]"
      role="banner"
      style={{ background: 'var(--color-header-bg)', boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}
    >
      <div className="flex items-center justify-between h-full px-2 sm:px-4 gap-1.5 sm:gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#"
            className="flex items-center gap-3 no-underline"
            aria-label="Stadium IQ - Go to Command Center"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('command');
            }}
          >
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Stadium IQ Logo"
                width="56"
                height="56"
                className="h-10 sm:h-14 w-auto rounded-lg shadow-sm"
              />
            </div>
            <div className="flex flex-col">
              <div
                className="font-bold text-xs sm:text-base tracking-tight leading-none"
                style={{ color: 'var(--color-header-text)' }}
              >
                Stadium IQ
              </div>
              <div
                className="text-[9px] sm:text-sm leading-none mt-1"
                style={{ color: 'var(--color-header-text)', opacity: 0.8 }}
              >
                FIFA World Cup 2026
              </div>
            </div>
          </a>
        </div>

        {/* Match Score - center */}
        <div
          className="flex items-center gap-1.5 sm:gap-4 rounded-lg sm:rounded-xl px-2 sm:px-5 py-1 sm:py-2"
          style={{ background: 'color-mix(in srgb, var(--color-header-text) 10%, transparent)' }}
          aria-label={`Match score: ${stadium.homeTeam} ${stadium.score} ${stadium.awayTeam}`}
        >
          <span
            className="font-bold text-xs sm:text-base"
            style={{ color: 'var(--color-header-text)' }}
          >
            {stadium.homeTeam}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <span
              className="font-mono text-sm sm:text-xl font-bold tracking-wider"
              style={{ color: 'var(--color-header-text)' }}
              aria-live="polite"
              aria-atomic="true"
            >
              {stadium.score}
            </span>
            <span
              className="text-[10px] sm:text-sm px-1 sm:px-2 py-0.5 rounded-md font-mono animate-pulse"
              style={{ background: 'rgba(197,50,50,0.8)', color: 'white' }}
              aria-label={`Match time: ${matchTime}`}
            >
              {matchTime}
            </span>
          </div>
          <span
            className="font-bold text-xs sm:text-base"
            style={{ color: 'var(--color-header-text)' }}
          >
            {stadium.awayTeam}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Role Toggle */}
          <RoleSelector role={role} setRole={setRole} />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full cursor-pointer transition-all hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#00f0ff]"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-lg sm:text-xl"
              style={{ color: 'var(--color-header-text)', fontVariationSettings: "'FILL' 1" }}
            >
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* AI Status / Demo Mode */}
          {geminiActive ? (
            <div
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--color-status-nominal) 15%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--color-status-nominal) 35%, transparent)',
              }}
              aria-label="AI Assistant is active"
            >
              <span
                className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full animate-pulse"
                style={{ background: COLORS.success }}
              />
              <span className="text-xs sm:text-sm font-medium" style={{ color: COLORS.success }}>
                AI Active
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-warning) 35%, transparent)',
              }}
              aria-label="Demo Mode active"
            >
              <span
                className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full animate-pulse"
                style={{ background: COLORS.warning }}
              />
              <span className="text-xs sm:text-sm font-medium" style={{ color: COLORS.warning }}>
                Demo Mode
              </span>
            </div>
          )}

          {/* Incident Alert Badge */}
          {activeIncidents > 0 && (
            <button
              aria-label={`View ${activeIncidents} active incidents`}
              onClick={() => setActiveView('command')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer transition-all hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#c8962e]"
              style={{
                background: 'rgba(198,40,40,0.25)',
                border: '1px solid rgba(198,40,40,0.5)',
              }}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-xs sm:text-base"
                style={{ color: COLORS.error, fontVariationSettings: "'FILL' 1" }}
              >
                emergency
              </span>
              <span className="text-xs sm:text-sm font-bold" style={{ color: COLORS.error }}>
                {activeIncidents}
              </span>
            </button>
          )}

          {/* Time */}
          <div
            className="text-xs sm:text-sm font-mono"
            style={{ color: 'var(--color-header-text)', opacity: 0.8 }}
          >
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  setActiveView: PropTypes.func.isRequired,
};

export default memo(Header);
