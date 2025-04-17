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

export function getRateLimiter(name, rpsLimit) {
  const limiter = algorithms[name];
  if (!limiter) throw new Error('Unknown rate limiting algorithm');

  // If it's the fixedWindow algorithm and rpsLimit is provided, create a wrapper function
  if (name === 'fixedWindow' && rpsLimit !== undefined) {
    return (req, res, next) => {
      // Set the rpsLimit for this request
      req.rpsLimit = rpsLimit;
      return limiter(req, res, next);
    };
  }

  return limiter;
}
