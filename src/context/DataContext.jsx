import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { FALLBACK, SHEET_URLS } from '../utils/fallbackData';
import { uniq } from '../utils/dataUtils';

const DataContext = createContext(null);

const INIT_RAW = {
  onboarding: [...FALLBACK.onboarding],
  daily: [...FALLBACK.daily],
};

const INIT_FILTERS = {
  zone: '',
  agent: '',
  date: '',
  onboardingType: '',
  storeType: '',
  readiness: '',
};

// Normalize a timestamp/date string to a short date key for grouping & filtering
function toDateKey(s) {
  if (!s) return '';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return s; }
}

function applyFilters(raw, filters) {
  const { zone, agent, date, onboardingType, storeType, readiness } = filters;
  return {
    onboarding: raw.onboarding.filter(x =>
      (!zone           || x['Assigned Zone'] === zone) &&
      (!agent          || x['Field Agent Name'] === agent) &&
      (!onboardingType || x['Who Are You Onboarding?'] === onboardingType) &&
      (!storeType      || x['Type of Store'] === storeType) &&
      (!readiness      || x['Merchant Readiness Level'] === readiness)
    ),
    daily: raw.daily.filter(x =>
      (!zone  || x['Assigned Zone'] === zone) &&
      (!agent || x['Agent Name'] === agent) &&
      (!date  || toDateKey(x['Date'] || x['Timestamp']) === date)
    ),
  };
}

function buildFilterOptions(raw) {
  return {
    zones: uniq([
      ...raw.onboarding.map(r => r['Assigned Zone']),
      ...raw.daily.map(r => r['Assigned Zone']),
    ]),
    agents: uniq([
      ...raw.onboarding.map(r => r['Field Agent Name']),
      ...raw.daily.map(r => r['Agent Name']),
    ]),
    dates: uniq(
      raw.daily.map(r => toDateKey(r['Date'] || r['Timestamp'])).filter(Boolean)
    ).sort(),
    onboardingTypes: uniq(raw.onboarding.map(r => r['Who Are You Onboarding?'])),
    storeTypes: uniq(raw.onboarding.map(r => r['Type of Store'])),
    readiness: uniq(raw.onboarding.map(r => r['Merchant Readiness Level'])),
  };
}

export function DataProvider({ children }) {
  const [raw, setRaw] = useState(INIT_RAW);
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [filtered, setFiltered] = useState(applyFilters(INIT_RAW, INIT_FILTERS));
  const [filterOptions, setFilterOptions] = useState(buildFilterOptions(INIT_RAW));
  const [status, setStatus] = useState({
    type: 'ok',
    message: '✓ Loaded with cached data — click Refresh to fetch live from Google Sheets',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setFiltered(applyFilters(raw, filters));
    setFilterOptions(buildFilterOptions(raw));
  }, [raw, filters]);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(INIT_FILTERS);
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setStatus({ type: 'loading', message: 'Fetching live data from Google Sheets...' });
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const [r1, r2] = await Promise.all([
        fetch(SHEET_URLS.onboarding, { signal: ctrl.signal, redirect: 'follow' }),
        fetch(SHEET_URLS.daily,      { signal: ctrl.signal, redirect: 'follow' }),
      ]);
      clearTimeout(timer);
      if (!r1.ok || !r2.ok) throw new Error('Sheet returned ' + (!r1.ok ? r1.status : r2.status));
      const [t1, t2] = await Promise.all([r1.text(), r2.text()]);
      const parseOpts = {
        header: true,
        skipEmptyLines: true,
        transformHeader: h => h.trim().replace(/\s+/g, ' '),
        transform: v => typeof v === 'string' ? v.trim() : v,
      };
      const p1 = Papa.parse(t1, parseOpts).data;
      const p2 = Papa.parse(t2, parseOpts).data;
      const newRaw = {
        onboarding: p1.length ? p1 : raw.onboarding,
        daily:      p2.length ? p2 : raw.daily,
      };
      setRaw(newRaw);
      const now = new Date();
      setLastUpdated(now);
      setStatus({
        type: 'ok',
        message: `✓ Live — ${newRaw.onboarding.length} onboarding + ${newRaw.daily.length} daily — synced at ${now.toLocaleTimeString()}`,
      });
    } catch (e) {
      setStatus({
        type: 'err',
        message: `Could not reach Google Sheets (${e.message || 'blocked'}) — showing last known data.`,
      });
    }
    setIsRefreshing(false);
  }, [raw]);

  useEffect(() => {
    const t = setTimeout(() => refresh(), 300);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DataContext.Provider value={{
      raw, filtered, filters, filterOptions,
      setFilter, clearAllFilters,
      refresh, status, isRefreshing, lastUpdated,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
