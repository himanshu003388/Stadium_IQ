import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const AppContext = createContext(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
};

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [role, setRole] = useState('organizer');
  const [uiLanguage, setUiLanguage] = useState('en');
  const [activeView, setActiveViewState] = useState('dashboard');

  const setActiveView = useCallback((view) => {
    setActiveViewState(view);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ACCESSIBILITY: Update <html lang> and <html dir> so screen readers adjust pronunciation and layout
  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguage === 'ar' ? 'rtl' : 'ltr';
  }, [uiLanguage]);

  const [geminiActive, setGeminiActive] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.geminiActive === 'boolean') {
          setGeminiActive(data.geminiActive);
        }
      })
      .catch(() => {
        // Fallback or ignore
      });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      activeView,
      setActiveView,
      role,
      setRole,
      uiLanguage,
      setUiLanguage,
      geminiActive,
    }),
    [theme, toggleTheme, activeView, setActiveView, role, uiLanguage, geminiActive],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
