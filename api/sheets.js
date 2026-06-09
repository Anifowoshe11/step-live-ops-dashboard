import { PRODUCTION_SHEETS } from '../src/config/productionSheets.js';

export default async function handler(request, response) {
  const source = request.query?.source;

  if (!source || !PRODUCTION_SHEETS[source]) {
    response.status(400).json({
      error: 'Invalid source. Use ?source=merchantOnboarding or ?source=finalDayReport',
    });
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
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-store');
    response.status(200).send(csv);
  } catch (error) {
    response.status(502).json({ error: error.message });
  }
}
