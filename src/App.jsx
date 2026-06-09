import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import Dashboard from './pages/Dashboard';
import {
  firebaseConfigurationMessage,
  isFirebaseConfigured,
  missingFirebaseEnvVars,
} from './lib/firebase';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Checking your Firebase session...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ message: 'Unauthorized access. Please sign in to open the dashboard.' }}
      />
    );
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Checking your Firebase session...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function FirebaseSetupScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo">
            <svg viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </div>
          <span className="nav-title">STEP Network Live Ops</span>
        </div>
        <div className="auth-title">Firebase setup required</div>
        <div className="auth-sub" style={{ marginBottom: '18px' }}>
          Firebase Email/Password authentication is enabled in the app, but the required Vite environment variables are missing.
        </div>
        <div className="auth-err" style={{ marginBottom: '16px' }}>
          {firebaseConfigurationMessage || 'Firebase is not configured.'}
        </div>
        <pre style={{ background: '#f8f9fa', border: '1px solid #dadce0', borderRadius: '6px', padding: '12px', fontSize: '11px', lineHeight: '1.7', overflowX: 'auto' }}>{`VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional in the current app
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id`}</pre>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '16px', lineHeight: '1.7' }}>
          <b>Missing now:</b><br />
          {missingFirebaseEnvVars.join(', ')}<br /><br />
          <b>Vercel setup:</b><br />
          1. Go to <b>console.firebase.google.com</b><br />
          2. Open your project -&gt; Add a Web app if you do not have one yet<br />
          3. Copy the <code style={{ background: '#f1f3f4', padding: '1px 4px', borderRadius: '3px' }}>firebaseConfig</code> values<br />
          4. Enable <b>Email/Password</b> in Authentication -&gt; Sign-in method<br />
          5. In Vercel -&gt; Project Settings -&gt; Environment Variables, add the required <code>VITE_</code> values above<br />
          6. Redeploy after saving the variables
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupScreen />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/signin"
            element={<PublicRoute><SignIn /></PublicRoute>}
          />
          <Route
            path="/signup"
            element={<PublicRoute><SignUp /></PublicRoute>}
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DataProvider>
                  <Dashboard />
                </DataProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
