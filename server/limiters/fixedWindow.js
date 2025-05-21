import { WINDOW_SIZE } from './constants.js';

export function fixedWindow(options = {}) {
  const {
    windowSize = WINDOW_SIZE, // 10 секунд по умолчанию
    limit = 5,         // лимит RPS по умолчанию
    keyGenerator = req => req.ip // генератор ключа по умолчанию
  } = options;

  const rateLimitMap = new Map();

  return function fixedWindowMiddleware(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);
    
    // Получаем или создаем запись для ключа
    const entry = rateLimitMap.get(key) || { count: 0, start: now };

    // Если окно истекло, сбрасываем счетчик
    if (now - entry.start >= windowSize) {
      entry.count = 1;
      entry.start = now;
      rateLimitMap.set(key, entry);
      return next();
    }

    // Проверяем лимит запросов
    if (entry.count >= limit) {
      return res.status(429).send('Too Many Requests (Fixed Window)');
    }

    entry.count++;
    rateLimitMap.set(key, entry);
    next();
  };
}
