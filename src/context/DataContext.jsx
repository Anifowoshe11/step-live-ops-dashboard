import { createContext, useContext, useEffect, useState } from 'react';
import { fetchDashboardSheetData } from '../services/googleSheets';
import {
  buildDashboardModel,
  createEmptyFinalDayReportData,
  createEmptyMerchantOnboardingData,
  transformFinalDayReportRows,
  transformMerchantOnboardingRows,
} from '../services/dashboardTransforms';

const DataContext = createContext(null);

const EMPTY_SOURCE_RESULTS = {
  merchantOnboarding: { ok: false, sheet: null, rows: [], error: '' },
  finalDayReport: { ok: false, sheet: null, rows: [], error: '' },
};

function createEmptyDashboardState() {
  return buildDashboardModel({
    merchantOnboarding: createEmptyMerchantOnboardingData(),
    finalDayReport: createEmptyFinalDayReportData(),
    sourceResults: EMPTY_SOURCE_RESULTS,
  });
}

export function DataProvider({ children }) {
  const [dashboard, setDashboard] = useState(createEmptyDashboardState());
  const [sourceResults, setSourceResults] = useState(EMPTY_SOURCE_RESULTS);
  const [status, setStatus] = useState({
    type: 'loading',
    message: 'Loading live data from Google Sheets...',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function refresh(silent = false) {
    if (!silent) {
      setIsRefreshing(true);
      setStatus({ type: 'loading', message: 'Fetching live data from Google Sheets...' });
    }

    try {
      const nextSourceResults = await fetchDashboardSheetData();
      const merchantOnboarding = nextSourceResults.merchantOnboarding.ok
        ? transformMerchantOnboardingRows(
            nextSourceResults.merchantOnboarding.rows,
            nextSourceResults.merchantOnboarding
          )
        : createEmptyMerchantOnboardingData();
      const finalDayReport = nextSourceResults.finalDayReport.ok
        ? transformFinalDayReportRows(
            nextSourceResults.finalDayReport.rows,
            nextSourceResults.finalDayReport
          )
        : createEmptyFinalDayReportData();

      const nextDashboard = buildDashboardModel({
        merchantOnboarding,
        finalDayReport,
        sourceResults: nextSourceResults,
      });

      setSourceResults(nextSourceResults);
      setDashboard(nextDashboard);
      setLastUpdated(new Date());

      const hasErrors = Object.values(nextSourceResults).some((result) => !result.ok);
      if (hasErrors) {
        const failedSources = Object.values(nextSourceResults)
          .filter((result) => !result.ok)
          .map((result) => result.sheet?.label || 'Google Sheet')
          .join(', ');

        setStatus({
          type: 'err',
          message: `Some Google Sheets could not be loaded: ${failedSources}. Live data remains visible where the fetch succeeded.`,
        });
      } else {
        setStatus({
          type: 'ok',
          message:
            `Live from Google Sheets - ${merchantOnboarding.stats.nonBlankRowCount} onboarding row(s), ` +
            `${finalDayReport.stats.nonBlankRowCount} final day row(s).`,
        });
      }
    } catch (error) {
      setSourceResults(EMPTY_SOURCE_RESULTS);
      setDashboard(createEmptyDashboardState());
      setStatus({
        type: 'err',
        message: `Could not reach Google Sheets (${error.message || 'unknown error'}). The dashboard is showing empty states instead of fallback data.`,
      });
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => refresh(), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refresh(true), 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DataContext.Provider
      value={{
        dashboard,
        sourceResults,
        refresh,
        status,
        isRefreshing,
        lastUpdated,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
