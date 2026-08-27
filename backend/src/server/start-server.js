export async function startServer({
  app,
  database,
  config,
  logger,
  installSignalHandlers = true,
  realtime,
}) {
  await database.connect();

  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(config.port, () => resolve(instance));
    instance.once('error', reject);
  });
  realtime?.attach(server);

  logger.info('server_started', { port: config.port, environment: config.nodeEnv });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('shutdown_started', { signal });

    const forceExit = setTimeout(() => {
      logger.error('shutdown_timeout', { timeoutMs: config.shutdownTimeoutMs });
      process.exitCode = 1;
    }, config.shutdownTimeoutMs);
    forceExit.unref();

    await realtime?.close();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await database.close();
    clearTimeout(forceExit);
    logger.info('shutdown_complete', { signal });
  };

  if (installSignalHandlers) {
    process.once('SIGTERM', () => void shutdown('SIGTERM'));
    process.once('SIGINT', () => void shutdown('SIGINT'));
  }

  return { server, shutdown };
}
