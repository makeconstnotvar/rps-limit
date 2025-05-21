import { WINDOW_SIZE } from './constants.js';
import { createAlgorithmState } from './algorithmInterface.js';

export const createTokenBucketState = (rpsLimit) => {
  const state = {
    ...createAlgorithmState(rpsLimit),
    tokens: rpsLimit,
    maxTokens: rpsLimit,
    refillRate: rpsLimit,
    lastRefill: Date.now(),
    
    handleRequest() {
      const now = Date.now();
      
      // Пополнение токенов
      const elapsedSec = (now - this.lastRefill) / 1000;
      const refill = Math.floor(elapsedSec * this.refillRate);
      if (refill > 0) {
        this.tokens = Math.min(this.maxTokens, this.tokens + refill);
        this.lastRefill = now;
      }
      
      // Расход токена
      this.tokens = Math.max(0, this.tokens - 1);
      
      return { ...this };
    },
    
    handleRejection() {
      const now = Date.now();
      
      // Пополнение токенов
      const elapsedSec = (now - this.lastRefill) / 1000;
      const refill = Math.floor(elapsedSec * this.refillRate);
      if (refill > 0) {
        this.tokens = Math.min(this.maxTokens, this.tokens + refill);
        this.lastRefill = now;
      }
      
      return { ...this };
    },
    
    update() {
      const now = Date.now();
      
      // Пополнение токенов
      const elapsedSec = (now - this.lastRefill) / 1000;
      const refill = Math.floor(elapsedSec * this.refillRate);
      if (refill > 0) {
        this.tokens = Math.min(this.maxTokens, this.tokens + refill);
        this.lastRefill = now;
      }
      
      return { ...this };
    },
    
    reset() {
      this.tokens = this.maxTokens;
      this.lastRefill = Date.now();
      return { ...this };
    }
  };
  
  return state;
};
