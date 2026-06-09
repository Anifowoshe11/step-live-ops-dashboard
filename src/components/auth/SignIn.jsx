import { useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from '../../utils/dataUtils';

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function SignIn() {
  const { signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 60;
  const routeMessage = useMemo(() => location.state?.message || '', [location.state]);

  const isLocked = lockedUntil && Date.now() < lockedUntil;
  const lockSecsLeft = isLocked ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      setFailCount(0);
      navigate('/');
    } catch (err) {
      const next = failCount + 1;
      setFailCount(next);
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        setFailCount(0);
        setError(`Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds before trying again.`);
      } else {
        setError(`${getAuthErrorMessage(err.code)} (${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next !== 1 ? 's' : ''} left)`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.svg" alt="STEP Network" style={{ height: '44px', width: 'auto' }} />
        </div>

        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to access the operations dashboard</div>

        {routeMessage && <div className="auth-info">{routeMessage}</div>}
        {isLocked && (
          <div className="auth-err">
            🔒 Account temporarily locked. Try again in {lockSecsLeft}s.
          </div>
        )}
        {!isLocked && error && <div className="auth-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email address</label>
            <input id="email" type="email" className="auth-input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="pwd-wrap">
              <input id="password" type={showPass ? 'text' : 'password'} className="auth-input"
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading || isLocked}>
            {isLocked ? `Locked — wait ${lockSecsLeft}s` : loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
