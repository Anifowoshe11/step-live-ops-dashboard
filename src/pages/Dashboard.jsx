import { useState, useEffect } from 'react';
import Nav from '../components/layout/Nav';
import ControlBar from '../components/layout/ControlBar';
import StatusBar from '../components/layout/StatusBar';
import Overview from './Overview';
import FieldOps from './FieldOps';
import Merchants from './Merchants';
import Agents from './Agents';
import Insights from './Insights';
import { useAuth } from '../context/AuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function WelcomeBanner({ user, onGoInsights, onDismiss }) {
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const greeting = getGreeting();

  return (
    <div className="welcome-banner">
      <div className="welcome-left">
        <div className="welcome-greeting">{greeting}, {firstName}! 👋</div>
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

export default function Dashboard() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('overview');
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 7000);
    return () => clearTimeout(t);
  }, []);

  const goInsights = () => {
    setActivePage('insights');
    setShowWelcome(false);
  };

  return (
    <>
      <Nav activePage={activePage} onPageChange={setActivePage} />
      <ControlBar />
      <StatusBar />
      {showWelcome && (
        <WelcomeBanner user={user} onGoInsights={goInsights} onDismiss={() => setShowWelcome(false)} />
      )}
      <div className="canvas">
        {activePage === 'overview'  && <Overview />}
        {activePage === 'fieldops'  && <FieldOps />}
        {activePage === 'merchants' && <Merchants />}
        {activePage === 'agents'    && <Agents />}
        {activePage === 'insights'  && <Insights />}
      </div>
    </>
  );
}
