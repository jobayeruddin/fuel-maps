// Low-stock threshold (liters). Override via env for each deployment.
export const LOW_STOCK_THRESHOLD = Number(
  process.env.LOW_STOCK_THRESHOLD ?? 100,
);