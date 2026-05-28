export const uniq = (arr) => [...new Set(arr.filter(Boolean))];

export const sumField = (arr, key) =>
  arr.reduce((a, r) => a + (parseFloat(r[key]) || 0), 0);

export const groupCount = (arr, key) => {
  const m = {};
  arr.forEach((r) => {
    const val = r[key] || 'Unknown';
    m[val] = (m[val] || 0) + 1;
  });
  return m;
};

export const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) + '%' : '—');

export const formatDate = (s) => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return s;
  }
};

export const getAuthErrorMessage = (code) => {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };
  return messages[code] || 'An error occurred. Please try again.';
};
