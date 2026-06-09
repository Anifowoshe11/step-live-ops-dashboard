import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export const REQUIRED_FIREBASE_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

export const OPTIONAL_FIREBASE_ENV_VARS = [
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
];

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const missingFirebaseEnvVars = REQUIRED_FIREBASE_ENV_VARS.filter(
  (envKey) => !import.meta.env[envKey]
);

export const isFirebaseConfigured = missingFirebaseEnvVars.length === 0;

export const firebaseConfigurationMessage = isFirebaseConfigured
  ? ''
  : `Missing required Firebase environment variables: ${missingFirebaseEnvVars.join(', ')}`;

let auth = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };
export default auth;
