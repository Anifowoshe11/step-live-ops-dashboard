export const uniq = (arr) => [...new Set(arr.filter(Boolean))];

export const sumBy = (arr, key) =>
  arr.reduce((total, row) => total + (typeof row[key] === 'number' ? row[key] : 0), 0);

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value || 0);

export const formatCompactNumber = (value) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);

export const formatPercent = (value) =>
  typeof value === 'number' ? `${Math.round(value)}%` : '—';

export const parseNumberValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const normalized = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toDateKey = (value) => {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return '';
  }

  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
};

export const formatDisplayDate = (value) => {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return '—';
  }

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDisplayDateTime = (value) => {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return '—';
  }

  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const normalizeText = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

export const isBlankObjectRow = (row) =>
  !Object.values(row || {}).some((value) => String(value || '').trim());

export const getAuthErrorMessage = (code) => {
  const messages = {
    'auth/not-configured': 'Firebase is not configured. Add the required VITE_FIREBASE_* variables before signing in.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-login-credentials': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/operation-not-allowed': 'Email/Password sign-in is not enabled in Firebase Authentication yet.',
  };
  return messages[code] || 'An error occurred. Please try again.';
};
