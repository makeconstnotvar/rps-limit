import { createFixedWindowState } from './fixedWindow.js';
import { createSlidingLogState } from './slidingLog.js';
import { createSlidingCounterState } from './slidingCounter.js';
import { createTokenBucketState } from './tokenBucket.js';
import { createLeakyBucketState } from './leakyBucket.js';

// Фабрика для создания состояния алгоритма
export const createAlgorithmState = (algorithm, rpsLimit) => {
  switch (algorithm) {
    case 'fixedWindow':
      return createFixedWindowState(rpsLimit);
    case 'slidingLog':
      return createSlidingLogState(rpsLimit);
    case 'slidingCounter':
      return createSlidingCounterState(rpsLimit);
    case 'tokenBucket':
      return createTokenBucketState(rpsLimit);
    case 'leakyBucket':
      return createLeakyBucketState(rpsLimit);
    default:
      throw new Error(`Неизвестный алгоритм: ${algorithm}`);
  }
};

// Функция для обновления состояния алгоритма при успешном запросе
export const handleRequest = (state) => {
  return state.handleRequest();
};

// Функция для обновления состояния алгоритма при отклоненном запросе
export const handleRejection = (state) => {
  return state.handleRejection();
};

// Функция для периодического обновления состояния алгоритма (для анимаций)
export const updateAlgorithmState = (state) => {
  return state.update();
};

// Функция для сброса состояния алгоритма
export const resetAlgorithmState = (state) => {
  return state.reset();
};

// Функция для проверки, превышен ли лимит запросов
export const isRateLimited = (state) => {
  switch (state.constructor.name) {
    case 'Object': // Для всех наших алгоритмов
      if ('timestamps' in state) { // Sliding Log
        return state.timestamps.length >= state.limit;
      } else if ('count' in state) { // Fixed Window
        return state.count >= state.limit;
      } else if ('buckets' in state) { // Sliding Counter
        const totalCount = state.buckets.reduce((sum, bucket) => sum + bucket.count, 0);
        return totalCount >= state.limit;
      } else if ('tokens' in state) { // Token Bucket
        return state.tokens <= 0;
      } else if ('queue' in state) { // Leaky Bucket
        return state.queue.length >= state.maxSize;
      }
      return false;
    default:
      return false;
  }
};
