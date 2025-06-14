import { WINDOW_SIZE } from './constants.js';

export function leakyBucket(options = {}) {
  const {
    windowSize = WINDOW_SIZE, // 10 секунд по умолчанию
    limit = 5,         // лимит RPS по умолчанию
    maxQueueSize = limit,  // максимальный размер очереди
    processRate = limit / (windowSize / 1000),   // скорость обработки (запросов/сек)
    keyGenerator = req => req.ip // генератор ключа по умолчанию
  } = options;

  const rateLimitQueueMap = new Map();

  function leakyBucketState() {
    const [bucket] = rateLimitQueueMap.values();
    return {
      size: bucket?.queue.length ?? 0,
      maxSize: maxQueueSize
    };
  }

  return function leakyBucketMiddleware(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);

    let bucket = rateLimitQueueMap.get(key);
    if (!bucket) {
      bucket = { queue: [], lastProcessed: now };
      rateLimitQueueMap.set(key, bucket);
    }

    // Рассчитываем утекшие запросы
    const elapsed = (now - bucket.lastProcessed) / 1000;
    const leaks = Math.floor(elapsed * processRate);

    if (leaks > 0) {
      bucket.queue.splice(0, leaks);
      bucket.lastProcessed = now;
    }

    if (bucket.queue.length >= maxQueueSize) {
      res.status(429).send('Too Many Requests (Leaky Bucket)');
      return;
    }
    
    bucket.queue.push(now);
    next();
  };
}
