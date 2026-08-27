import { pathToFileURL } from 'node:url';

export async function runSmokeTest({ baseUrl, fetchImplementation = fetch }) {
  if (!baseUrl) throw new Error('SMOKE_BASE_URL is required');
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  const healthResponse = await fetchImplementation(`${normalizedBaseUrl}/health`);
  const health = await healthResponse.json();
  if (!healthResponse.ok || health?.success !== true || health?.data?.status !== 'ready') {
    throw new Error(`Health check failed with HTTP ${healthResponse.status}`);
  }

  const docsResponse = await fetchImplementation(`${normalizedBaseUrl}/api-docs.json`);
  const docs = await docsResponse.json();
  if (!docsResponse.ok || docs?.openapi !== '3.0.3' || !docs?.paths?.['/api/v1/media']) {
    throw new Error(`OpenAPI check failed with HTTP ${docsResponse.status}`);
  }

  return {
    baseUrl: normalizedBaseUrl,
    database: health.data.database,
    openApiVersion: docs.openapi,
    documentedPaths: Object.keys(docs.paths).length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSmokeTest({ baseUrl: process.env.SMOKE_BASE_URL })
    .then((result) => console.log(JSON.stringify({ success: true, ...result })))
    .catch((error) => {
      console.error(JSON.stringify({ success: false, error: error.message }));
      process.exitCode = 1;
    });
}
