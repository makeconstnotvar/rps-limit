import {fixedWindow} from './limiters/fixedWindow.js';
import {slidingLog} from './limiters/slidingLog.js';
import {slidingCounter} from './limiters/slidingCounter.js';
import {tokenBucket} from './limiters/tokenBucket.js';
import {leakyBucket} from './limiters/leakyBucket.js';

const algorithms = {
  fixedWindow,
  slidingLog,
  slidingCounter,
  tokenBucket,
  leakyBucket
};

export function getRateLimiter(name) {
  const limiter = algorithms[name];
  if (!limiter) throw new Error('Unknown rate limiting algorithm');
  return limiter;
}
