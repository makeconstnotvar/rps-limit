export function slidingCounter(options = {}) {
  const {
    windowSize = 1000, // 1 секунда по умолчанию
    bucketSize = 100,  // 100ms сегменты по умолчанию
    limit = 5,         // лимит RPS по умолчанию
    keyGenerator = req => req.ip // генератор ключа по умолчанию
  } = options;

  const rateLimitBucketMap = new Map();

  function slidingCounterState() {
    const [buckets] = rateLimitBucketMap.values();
    const now = Math.floor(Date.now() / bucketSize);
    if (!buckets) return { buckets: [] };

    return {
      buckets: Array.from(buckets.entries())
        .filter(([bucket]) => (now - bucket) * bucketSize <= windowSize)
        .map(([bucket, count]) => ({
          age: (now - bucket) * bucketSize,
          count
        }))
    };
  }

  return function slidingCounterMiddleware(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);
    const currentBucket = Math.floor(now / bucketSize);

    if (!rateLimitBucketMap.has(key)) {
      rateLimitBucketMap.set(key, new Map());
    }

    const buckets = rateLimitBucketMap.get(key);
    buckets.set(currentBucket, (buckets.get(currentBucket) || 0) + 1);

    // Удаляем старые сегменты
    for (const [bucket] of buckets) {
      if ((currentBucket - bucket) * bucketSize > windowSize) {
        buckets.delete(bucket);
      }
    }

    // Суммируем активные сегменты
    const total = Array.from(buckets.values()).reduce((sum, n) => sum + n, 0);
    if (total > limit) {
      res.status(429).send('Too Many Requests (Sliding Counter)');
    } else {
      next();
    }
  };
}
