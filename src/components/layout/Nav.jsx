import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function Nav() {
  const { signOut, user } = useAuth();
  const { dashboard, refresh, isRefreshing } = useData();
  const connectedSources = dashboard.sourceStatus.filter((source) => source.tone === 'ok').length;

  return (
    <nav className="nav">
      <img src="/logo.svg" alt="STEP Network" className="nav-logo" />
      <div className="nav-brand">
        <span className="nav-brand-title">STEP Network Live Ops</span>
        <span className="nav-brand-sub">Production Google Sheets Dashboard</span>
      </div>
      <div className="nav-r">
        <div className="live-pill">
          <div className="dot" />
          <span className="live-pill-text">{connectedSources}/2 Sheets Live</span>
        </div>
        {user && (
          <span className="nav-user" title={user.email}>
            {user.email}
          </span>
        )}
        <button
          className={`ref-btn${isRefreshing ? ' spin' : ''}`}
          onClick={() => refresh()}
          disabled={isRefreshing}
        >
          <svg viewBox="0 0 24 24">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
          <span className="ref-btn-text">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
        <button className="signout-btn" onClick={signOut} title="Sign out">
          <svg viewBox="0 0 24 24">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
