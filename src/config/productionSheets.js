// Update these URLs if the Google Sheet or tab gid changes.
export const PRODUCTION_SHEETS = {
  merchantOnboarding: {
    key: 'merchantOnboarding',
    label: 'Merchant Onboarding Sheet',
    description: 'Store onboarding submissions exported from Google Sheets.',
    csvUrl:
      'https://docs.google.com/spreadsheets/d/1D4Ms9jutyhM2kuVmSN5S1_820sAu2PQU9YT1lJwZPD8/export?format=csv&gid=2096627106',
  },
  finalDayReport: {
    key: 'finalDayReport',
    label: 'Final Day Report Sheet',
    description: 'Daily performance submissions exported from Google Sheets.',
    csvUrl:
      'https://docs.google.com/spreadsheets/d/1ryixaP5g9VRHjYTtKJW1SzuE04KkbBir-wSYILyzhHY/export?format=csv&gid=1136748544',
  },
};

export const SHEET_ORDER = ['merchantOnboarding', 'finalDayReport'];
