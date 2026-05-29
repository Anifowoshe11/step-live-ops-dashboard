import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const PAGES = [
  { id: 'overview',    label: 'Overview' },
  { id: 'fieldops',    label: 'Daily Report' },
  { id: 'merchants',   label: 'Network' },
  { id: 'agents',      label: 'Agents' },
  { id: 'insights',    label: 'Insights' },
  { id: 'escalations', label: '🚨 Escalations' },
];

export default function Nav({ activePage, onPageChange }) {
  const { signOut, user } = useAuth();
  const { refresh, isRefreshing } = useData();

  return (
    <nav className="nav">
      <div className="logo">
        <svg viewBox="0 0 24 24">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        </svg>
      </div>
      <span className="nav-title">STEP Network Live Ops</span>
      <div className="nav-sep" />
      <div className="tabs">
        {PAGES.map((p) => (
          <button
            key={p.id}
            className={`tab${activePage === p.id ? ' active' : ''}`}
            onClick={() => onPageChange(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="nav-r">
        <div className="live-pill">
          <div className="dot" />
          2 Sources
        </div>
        {user && (
          <span className="nav-user" title={user.email}>
            {user.email}
          </span>
        )}
        <button
          className={`ref-btn${isRefreshing ? ' spin' : ''}`}
          onClick={refresh}
          disabled={isRefreshing}
        >
          <svg viewBox="0 0 24 24">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
          {isRefreshing ? 'Refreshing…' : 'Refresh Data'}
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
