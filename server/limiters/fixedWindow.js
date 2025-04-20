const rateLimitMap = new Map();
const WINDOW_SIZE = 1000; // 1 секунда
let MAX_REQUESTS = 20; // Значение по умолчанию

export function fixedWindow(req, res, next) {
  // Обновляем MAX_REQUESTS, если передан лимит
  if (req.rpsLimit !== undefined) {
    MAX_REQUESTS = req.rpsLimit;
  }

  const now = Date.now();
  const entry = rateLimitMap.get('global') || { count: 0, start: now };

  // Если окно истекло, сбрасываем счетчик
  if (now - entry.start >= WINDOW_SIZE) {
    entry.count = 1;
    entry.start = now;
    rateLimitMap.set('global', entry);
    return next();
  }

  // Проверяем лимит запросов
  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).send('Too Many Requests (Fixed Window)');
  }

  entry.count++;
  rateLimitMap.set('global', entry);
  next();
}