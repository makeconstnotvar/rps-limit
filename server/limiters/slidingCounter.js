const rateLimitBucketMap = new Map();
const WINDOW_SIZE = 60 * 1000;
const BUCKET_SIZE = 10 * 1000;
const MAX_REQUESTS = 20;

function slidingCounter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const currentBucket = Math.floor(now / BUCKET_SIZE);

  if (!rateLimitBucketMap.has(ip)) {
    rateLimitBucketMap.set(ip, new Map());
  }

  const buckets = rateLimitBucketMap.get(ip);
  buckets.set(currentBucket, (buckets.get(currentBucket) || 0) + 1);

  for (const [bucket] of buckets) {
    if ((currentBucket - bucket) * BUCKET_SIZE > WINDOW_SIZE) {
      buckets.delete(bucket);
    }
  }

  const total = Array.from(buckets.values()).reduce((sum, n) => sum + n, 0);
  if (total > MAX_REQUESTS) {
    res.status(429).send('Too Many Requests (Sliding Counter)');
  } else {
    next();
  }
}

function slidingCounterState() {
  const [buckets] = rateLimitBucketMap.values();
  const now = Math.floor(Date.now() / BUCKET_SIZE);
  if (!buckets) return { buckets: [] };

  return {
    buckets: Array.from(buckets.entries())
      .filter(([bucket]) => now - bucket <= 6)
      .map(([bucket, count]) => ({
        age: now - bucket,
        count
      }))
  };
}

export { slidingCounterState,slidingCounter };
