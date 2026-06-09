/** Dev-only API route timing — logs duration to help compare before/after optimizations. */
export async function withApiTiming<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV !== "development") {
    return fn();
  }
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const ms = Math.round(performance.now() - start);
    console.log(`[api-timing] ${label}: ${ms}ms`);
  }
}
