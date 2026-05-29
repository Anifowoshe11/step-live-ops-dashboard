import { useState, useEffect, useCallback } from 'react';
import Nav from '../components/layout/Nav';
import ControlBar from '../components/layout/ControlBar';
import StatusBar from '../components/layout/StatusBar';
import Overview from './Overview';
import FieldOps from './FieldOps';
import Merchants from './Merchants';
import Agents from './Agents';
import Insights from './Insights';
import Escalations from './Escalations';
import { ToastContainer } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function WelcomeBanner({ user, onGoInsights, onDismiss }) {
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  return (
    <div className="welcome-banner">
      <div className="welcome-left">
        <div className="welcome-greeting">{getGreeting()}, {firstName}! 👋</div>
        <div className="welcome-note">
          You're in. Head to{' '}
          <button className="welcome-link" onClick={onGoInsights}>Insights</button>
          {' '}to see today's field feedback and alerts from your agents.
        </div>
      </div>
      <button className="welcome-dismiss" onClick={onDismiss} title="Dismiss">✕</button>
    </div>
  );
}

// Request browser notification permission once
async function requestBrowserNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

function sendBrowserNotif(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

export default function Dashboard() {
  const { user }                             = useAuth();
  const { newRowDelta, clearNewRowDelta, filtered } = useData();
  const [activePage, setActivePage]          = useState('overview');
  const [showWelcome, setShowWelcome]        = useState(true);
  const [toasts, setToasts]                  = useState([]);
  const [badges, setBadges]                  = useState({ fieldops: 0, escalations: 0 });

  // Ask for browser notification permission on mount
  useEffect(() => { requestBrowserNotifPermission(); }, []);

  // Auto-dismiss welcome after 7s
  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 7000);
    return () => clearTimeout(t);
  }, []);

  // Watch for new sheet data → fire toast + browser notif + badge
  useEffect(() => {
    if (newRowDelta.daily === 0 && newRowDelta.onboarding === 0) return;

    const agentNames = newRowDelta.agents.length
      ? newRowDelta.agents.join(' & ')
      : 'an agent';

    const msgs = [];
    if (newRowDelta.daily > 0)
      msgs.push(`${newRowDelta.daily} new daily report${newRowDelta.daily > 1 ? 's' : ''} from ${agentNames}`);
    if (newRowDelta.onboarding > 0)
      msgs.push(`${newRowDelta.onboarding} new onboarding${newRowDelta.onboarding > 1 ? 's' : ''}`);

    const message = msgs.join(' · ');

    // Detect critical block rate in new daily data
    const vis = filtered.daily.reduce((s, r) => s + (parseFloat(r['Total Merchants Visited Today']) || 0), 0);
    const blk = filtered.daily.reduce((s, r) => s + (parseFloat(r["Interested Merchants But Couldn't Enroll"]) || 0), 0);
    const br  = vis > 0 ? Math.round((blk / vis) * 100) : 0;
    const isCritical = br >= 100 && vis > 0;

    addToast({
      title: isCritical ? '🚨 Critical — 100% Block Rate' : '📊 New Field Data',
      message,
      type: isCritical ? 'critical' : 'info',
      duration: isCritical ? 10000 : 6000,
    });

    sendBrowserNotif(
      isCritical ? '🚨 STEP — 100% Block Rate' : '📊 STEP — New field data',
      message
    );

    // Badge on Daily Report tab
    if (newRowDelta.daily > 0) {
      setBadges(b => ({ ...b, fieldops: b.fieldops + newRowDelta.daily }));
    }

    clearNewRowDelta();
  }, [newRowDelta]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...toast }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Clear badge when user visits that tab
  const handlePageChange = (page) => {
    setActivePage(page);
    if (page === 'fieldops')    setBadges(b => ({ ...b, fieldops: 0 }));
    if (page === 'escalations') setBadges(b => ({ ...b, escalations: 0 }));
  };

  const goInsights = () => {
    setActivePage('insights');
    setShowWelcome(false);
  };

  // Callback from Escalations page to update badge
  const handleEscalationCount = useCallback((openCount) => {
    setBadges(b => ({ ...b, escalations: openCount }));
  }, []);

  return (
    <>
      <Nav activePage={activePage} onPageChange={handlePageChange} badges={badges} />
      <ControlBar />
      <StatusBar />
      {showWelcome && (
        <WelcomeBanner user={user} onGoInsights={goInsights} onDismiss={() => setShowWelcome(false)} />
      )}
      <div className="canvas">
        {activePage === 'overview'    && <Overview />}
        {activePage === 'fieldops'    && <FieldOps />}
        {activePage === 'merchants'   && <Merchants />}
        {activePage === 'agents'      && <Agents />}
        {activePage === 'insights'    && <Insights />}
        {activePage === 'escalations' && <Escalations onOpenCountChange={handleEscalationCount} />}
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
