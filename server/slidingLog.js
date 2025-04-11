const rateLimitLogMap = new Map();
const WINDOW_SIZE = 60 * 1000;
const MAX_REQUESTS = 20;

function slidingLog(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimitLogMap.has(ip)) {
    rateLimitLogMap.set(ip, []);
  }

  const timestamps = rateLimitLogMap.get(ip);

  while (timestamps.length && now - timestamps[0] > WINDOW_SIZE) {
    timestamps.shift();
  }

  if (timestamps.length >= MAX_REQUESTS) {
    res.status(429).send('Too Many Requests (Sliding Log)');
  } else {
    timestamps.push(now);
    next();
  }
}

function getState() {
  const [first] = rateLimitLogMap.values();
  return {
    timestamps: (first ?? []).map(ts => Date.now() - ts) // возраст каждой метки в мс
  };
}

export default slidingLog;
export { getState };
