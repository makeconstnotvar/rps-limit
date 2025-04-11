const rateLimitMap = new Map();
const WINDOW_SIZE = 60 * 1000; // 1 минута
const MAX_REQUESTS = 20;

export default function fixedWindow(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > WINDOW_SIZE) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count += 1;
  }

  rateLimitMap.set(ip, entry);

  if (entry.count > MAX_REQUESTS) {
    res.status(429).send('Too Many Requests (Fixed Window)');
  } else {
    next();
  }
}
