import { createContext, useContext, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseConfigurationMessage } from '../lib/firebase';

const AuthContext = createContext(null);

function createAuthConfigurationError() {
  const error = new Error(firebaseConfigurationMessage || 'Firebase is not configured.');
  error.code = 'auth/not-configured';
  return error;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    async function initializeAuthSession() {
      if (!auth) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        // If persistence cannot be set, continue with Firebase defaults.
      }

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) {
          return;
        }

        setUser(firebaseUser);
        setLoading(false);
      });
    }

    initializeAuthSession();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signUp = async (email, password, displayName) => {
    if (!auth) {
      throw createAuthConfigurationError();
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
      setUser({ ...result.user, displayName });
    }
    return result;
  };

  const signIn = async (email, password) => {
    if (!auth) {
      throw createAuthConfigurationError();
    }

    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (!auth) {
      throw createAuthConfigurationError();
    }

    return firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
