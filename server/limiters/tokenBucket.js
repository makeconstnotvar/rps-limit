export function tokenBucket(options = {}) {
  const {
    limit = 5,         // лимит RPS по умолчанию
    maxTokens = 5,     // максимум токенов по умолчанию
    refillRate = 5,    // скорость пополнения (токенов/сек) по умолчанию
    keyGenerator = req => req.ip // генератор ключа по умолчанию
  } = options;

  const rateLimitTokenMap = new Map();

  function tokenBucketState() {
    const [bucket] = rateLimitTokenMap.values();
    return {
      tokens: bucket?.tokens ?? maxTokens,
      maxTokens: maxTokens
    };
  }

  return function tokenBucketMiddleware(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);

    let bucket = rateLimitTokenMap.get(key);
    if (!bucket) {
      bucket = { tokens: maxTokens, lastRefill: now };
      rateLimitTokenMap.set(key, bucket);
    }

    // Рассчитываем пополнение
    const elapsed = (now - bucket.lastRefill) / 1000;
    const refill = Math.floor(elapsed * refillRate);

    if (refill > 0) {
      bucket.tokens = Math.min(maxTokens, bucket.tokens + refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens < 1) {
      res.status(429).send('Too Many Requests (Token Bucket)');
    } else {
      bucket.tokens -= 1;
      next();
    }
  };
}
