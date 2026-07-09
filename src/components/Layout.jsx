/**
 * Layout Component - Main application shell with view routing and simulation lifecycle
 * @component
 */
import React, { Suspense, memo, useEffect, useMemo } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { StadiumProvider } from '../context/StadiumContext';
import { AppProvider, useAppContext } from '../context/AppContext';
import { COLORS, NAV_ITEMS } from '../utils/styles';
import { ErrorBoundary } from './ErrorBoundary';
import Announcer from './Announcer';
import { NotificationsContainer } from './NotificationToast';

const CommandCenter = React.lazy(() => import('./CommandCenter'));
const AIAssistant = React.lazy(() => import('./AIAssistant'));
const CrowdMap = React.lazy(() => import('./CrowdMap'));
const VolunteerDispatch = React.lazy(() => import('./VolunteerDispatch'));
const TransportHub = React.lazy(() => import('./TransportHub'));
const Sustainability = React.lazy(() => import('./Sustainability'));
const AccessibilityHub = React.lazy(() => import('./AccessibilityHub'));
const VendorDashboard = React.lazy(() => import('./VendorDashboard'));
const VolunteerMobile = React.lazy(() => import('./VolunteerMobile'));

const VIEWS = {
  dashboard: CommandCenter,
  assistant: AIAssistant,
  crowdmap: CrowdMap,
  volunteers: VolunteerDispatch,
  transport: TransportHub,
  sustainability: Sustainability,
  accessibility: AccessibilityHub,
  vendors: VendorDashboard,
  'volunteer-mobile': VolunteerMobile,
};

/**
 * Inner layout component with active view routing
 * Syncs active view with context for simulation awareness
 * @returns {React.ReactElement}
 */
function LayoutInner() {
  const { role, activeView, setActiveView } = useAppContext();

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.allowedRoles?.includes(role)),
    [role],
  );

  useEffect(() => {
    const isAllowed = allowedNavItems.some((item) => item.id === activeView);
    if (!isAllowed && allowedNavItems.length > 0) {
      setActiveView(allowedNavItems[0].id);
    }
  }, [activeView, allowedNavItems, setActiveView]);

  const ActivePanel = VIEWS[activeView] || CommandCenter;

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <Announcer activeView={activeView} />
      <NotificationsContainer />
      <div
        className="min-h-screen flex flex-col"
        style={{ background: COLORS.background, color: COLORS.onBackground }}
      >
        <Header activeView={activeView} setActiveView={setActiveView} />
        <div className="flex flex-1 pt-20">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 md:ml-72 overflow-y-auto min-h-[calc(100vh-5rem)] pb-16 md:pb-0 custom-scrollbar"
            role="main"
            aria-label="Main content area"
          >
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div
                      className="animate-spin rounded-full h-8 w-8 border-b-2"
                      style={{ borderColor: COLORS.onSurface }}
                    ></div>
                  </div>
                }
              >
                <ActivePanel />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
}

/**
 * Main Layout component wrapped with StadiumProvider
 * @returns {React.ReactElement}
 */
function Layout() {
  return (
    <StadiumProvider>
      <AppProvider>
        <LayoutInner />
      </AppProvider>
    </StadiumProvider>
  );
}

export default memo(Layout);
