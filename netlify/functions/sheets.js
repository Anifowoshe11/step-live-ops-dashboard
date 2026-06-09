// Server-side Google Sheets proxy.
// Update the source URLs in src/config/productionSheets.js if the workbook or gid changes.

exports.handler = async function (event) {
  const { PRODUCTION_SHEETS } = await import('../../src/config/productionSheets.js');
  const source = event.queryStringParameters && event.queryStringParameters.source;

  if (!source || !PRODUCTION_SHEETS[source]) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid source. Use ?source=merchantOnboarding or ?source=finalDayReport',
      }),
    };
  }

  try {
    const response = await fetch(PRODUCTION_SHEETS[source].csvUrl, { redirect: 'follow' });
    if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}`);
    const csv = await response.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
      },
      body: csv,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
