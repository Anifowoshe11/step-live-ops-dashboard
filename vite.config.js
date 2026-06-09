import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { PRODUCTION_SHEETS } from './src/config/productionSheets.js';

function googleSheetsDevApi() {
  return {
    name: 'google-sheets-dev-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.originalUrl || request.url || '';
        if (!requestUrl.startsWith('/api/sheets')) {
          next();
          return;
        }

        const url = new URL(requestUrl, 'http://localhost');
        const source = url.searchParams.get('source');

        if (!source || !PRODUCTION_SHEETS[source]) {
          response.statusCode = 400;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(
            JSON.stringify({
              error: 'Invalid source. Use ?source=merchantOnboarding or ?source=finalDayReport',
            })
          );
          return;
        }

        try {
          const sheetResponse = await fetch(PRODUCTION_SHEETS[source].csvUrl, {
            redirect: 'follow',
          });

          if (!sheetResponse.ok) {
            throw new Error(`Google Sheets returned HTTP ${sheetResponse.status}`);
          }

          const csv = await sheetResponse.text();
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/csv; charset=utf-8');
          response.setHeader('Cache-Control', 'no-cache, no-store');
          response.end(csv);
        } catch (error) {
          response.statusCode = 502;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), googleSheetsDevApi()],
  build: {
    sourcemap: false,          // never ship source maps — hides original code in prod
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2') || id.includes('node_modules/chartjs-plugin-datalabels')) {
            return 'chart-vendor';
          }
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase-vendor';
          }
        },
      },
    },
  },
});
