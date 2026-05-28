import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from '../../utils/dataUtils';

const SPECIAL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

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

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rules = {
    length: password.length >= 8,
    capital: /^[A-Z]/.test(password),
    special: SPECIAL.test(password),
  };
  const allRulesPass = rules.length && rules.capital && rules.special;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) { setError('Please enter your first name.'); return; }
    if (!allRulesPass) {
      if (!rules.capital) { setError('Password must start with a capital letter.'); return; }
      if (!rules.special) { setError('Password must include at least one special character (!@#$%...).'); return; }
      if (!rules.length)  { setError('Password must be at least 8 characters.'); return; }
    }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await signUp(email, password, displayName);
      navigate('/');
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo">
            <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" /></svg>
          </div>
          <span className="nav-title">STEP Network Live Ops</span>
        </div>

        <div className="auth-title">Create your account</div>
        <div className="auth-sub">Join the STEP operations team</div>

        {error && <div className="auth-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="r g2" style={{ gap: '10px', marginBottom: '14px' }}>
            <div className="auth-field" style={{ marginBottom: 0 }}>
              <label className="auth-label" htmlFor="firstName">First name</label>
              <input id="firstName" type="text" className="auth-input" placeholder="Ada" value={firstName}
                onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
            </div>
            <div className="auth-field" style={{ marginBottom: 0 }}>
              <label className="auth-label" htmlFor="lastName">Last name</label>
              <input id="lastName" type="text" className="auth-input" placeholder="Okafor" value={lastName}
                onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email address</label>
            <input id="email" type="email" className="auth-input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="pwd-wrap">
              <input id="password" type={showPass ? 'text' : 'password'} className="auth-input"
                placeholder="Min. 8 chars, capital + special" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            {password.length > 0 && (
              <div className="pwd-hints">
                <span className={`pwd-hint ${rules.capital ? 'ok' : ''}`}>Starts with capital</span>
                <span className={`pwd-hint ${rules.special ? 'ok' : ''}`}>Special character</span>
                <span className={`pwd-hint ${rules.length ? 'ok' : ''}`}>8+ characters</span>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm">Confirm password</label>
            <div className="pwd-wrap">
              <input id="confirm" type={showConfirm ? 'text' : 'password'} className="auth-input"
                placeholder="Re-enter password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
              <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading || !allRulesPass}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
