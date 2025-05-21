import { WINDOW_SIZE } from './constants.js';

export function slidingLog(options = {}) {
  const {
    windowSize = WINDOW_SIZE, // 10 секунд по умолчанию
    limit = 5,         // лимит RPS по умолчанию
    keyGenerator = req => req.ip // генератор ключа по умолчанию
  } = options;

  const rateLimitLogMap = new Map();

  function slidingLogState() {
    const [first] = rateLimitLogMap.values();
    return {
      timestamps: (first ?? []).map(ts => Date.now() - ts) // возраст каждой метки в мс
    };
  }

  return function slidingLogMiddleware(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);

    if (!rateLimitLogMap.has(key)) {
      rateLimitLogMap.set(key, []);
    }

    const timestamps = rateLimitLogMap.get(key);

    // Удаляем старые метки за пределами окна
    while (timestamps.length && now - timestamps[0] > windowSize) {
      timestamps.shift();
    }

    // Проверяем лимит
    if (timestamps.length >= limit) {
      res.status(429).send('Too Many Requests (Sliding Log)');
    } else {
      timestamps.push(now);
      next();
    }
  };
}
