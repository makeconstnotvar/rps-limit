import fixedWindow from './fixedWindow.js';
import slidingLog from './slidingLog.js';
import slidingCounter from './slidingCounter.js';
import tokenBucket from './tokenBucket.js';
import leakyBucket from './leakyBucket.js';

const algorithms = {
  fixed: fixedWindow,
  'sliding-log': slidingLog,
  'sliding-counter': slidingCounter,
  token: tokenBucket,
  leaky: leakyBucket
};

export function getRateLimiter(name) {
  const limiter = algorithms[name];
  if (!limiter) throw new Error('Unknown rate limiting algorithm');
  return limiter;
}
