import Papa from 'papaparse';
import { PRODUCTION_SHEETS, SHEET_ORDER } from '../config/productionSheets';
import { isBlankObjectRow } from '../utils/dataUtils';

const PARSE_OPTIONS = {
  header: true,
  skipEmptyLines: false,
  transformHeader: (header) => header.trim().replace(/\s+/g, ' '),
  transform: (value) => (typeof value === 'string' ? value.trim() : value),
};

function getSheetUrl(sheetKey) {
  if (!PRODUCTION_SHEETS[sheetKey]) {
    throw new Error(`Unknown sheet source: ${sheetKey}`);
  }

  // Keep sheet access behind the app's backend route so the frontend does not
  // depend on direct Google Sheets URLs.
  return `/api/sheets?source=${sheetKey}`;
}

async function readResponseError(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json();
    return payload.error || `Google Sheets returned HTTP ${response.status}`;
  }

  const text = await response.text();
  return text || `Google Sheets returned HTTP ${response.status}`;
}

export async function fetchGoogleSheetRows(sheetKey) {
  const sheet = PRODUCTION_SHEETS[sheetKey];
  const response = await fetch(getSheetUrl(sheetKey), { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(await readResponseError(response));
  }

  const csv = await response.text();
  const parsed = Papa.parse(csv, PARSE_OPTIONS);
  const rows = parsed.data || [];

  return {
    ok: true,
    sheet,
    headers: parsed.meta.fields || [],
    rows,
    blankRowCount: rows.filter(isBlankObjectRow).length,
    parseErrors: parsed.errors || [],
  };
}

export async function fetchDashboardSheetData() {
  const entries = await Promise.allSettled(
    SHEET_ORDER.map(async (sheetKey) => [sheetKey, await fetchGoogleSheetRows(sheetKey)])
  );

  return Object.fromEntries(
    entries.map((entry, index) => {
      const sheetKey = SHEET_ORDER[index];

      if (entry.status === 'fulfilled') {
        return [sheetKey, entry.value[1]];
      }

      return [
        sheetKey,
        {
          ok: false,
          sheet: PRODUCTION_SHEETS[sheetKey],
          headers: [],
          rows: [],
          blankRowCount: 0,
          parseErrors: [],
          error: entry.reason?.message || 'Could not load Google Sheet.',
        },
      ];
    })
  );
}
