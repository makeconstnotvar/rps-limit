const rateLimitQueueMap = new Map();
const MAX_QUEUE_SIZE = 20;
const PROCESS_RATE = 1;

function leakyBucket(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimitQueueMap.has(ip)) {
    rateLimitQueueMap.set(ip, { queue: [], lastProcessed: now });
  }

  const bucket = rateLimitQueueMap.get(ip);
  const elapsed = (now - bucket.lastProcessed) / 1000;
  const leaks = Math.floor(elapsed * PROCESS_RATE);

  if (leaks > 0) {
    bucket.queue.splice(0, leaks);
    bucket.lastProcessed = now;
  }

  if (bucket.queue.length >= MAX_QUEUE_SIZE) {
    res.status(429).send('Too Many Requests (Leaky Bucket)');
  } else {
    bucket.queue.push(now);
    next();
  }
}

function leakyBucketState() {
  const [first] = rateLimitQueueMap.values();
  return {
    size: first?.queue.length ?? 0,
    maxSize: MAX_QUEUE_SIZE
  };
}

export { leakyBucket, leakyBucketState };
