import {fixedWindow} from './limiters/fixedWindow.js';
import {slidingLog} from './limiters/slidingLog.js';
import {slidingCounter} from './limiters/slidingCounter.js';
import {tokenBucket} from './limiters/tokenBucket.js';
import {leakyBucket} from './limiters/leakyBucket.js';

const algorithmFactories = {
  fixedWindow,
  slidingLog,
  slidingCounter,
  tokenBucket,
  leakyBucket
};

const limitersCache = new Map();

export function getRateLimiter(name, rpsLimit = 5) {
  const factory = algorithmFactories[name];
  if (!factory) throw new Error('Unknown rate limiting algorithm');

  // Кешируем лимитеры с одинаковыми параметрами
    const cacheKey = `${name}:${rpsLimit}`;
    if (!limitersCache.has(cacheKey)) {
      limitersCache.set(cacheKey, factory({
        limit: rpsLimit,
        windowSize: 10000 // 10 секунд по умолчанию
      }));
    }

  return limitersCache.get(cacheKey);
}
