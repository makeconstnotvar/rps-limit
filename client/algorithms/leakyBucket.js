import { WINDOW_SIZE } from './constants.js';
import { createAlgorithmState } from './algorithmInterface.js';

export const createLeakyBucketState = (rpsLimit) => {
  const state = {
    ...createAlgorithmState(rpsLimit),
    queue: [],
    maxSize: rpsLimit,
    processRate: rpsLimit,
    lastProcess: Date.now(),
    
    handleRequest() {
      const now = Date.now();
      
      // Обработка очереди
      const leakElapsedSec = (now - this.lastProcess) / 1000;
      const leaks = Math.floor(leakElapsedSec * this.processRate);
      if (leaks > 0) {
        this.queue.splice(0, Math.min(leaks, this.queue.length));
        this.lastProcess = now;
      }
      
      // Добавление в очередь
      this.queue.push(now);
      
      return { ...this };
    },
    
    handleRejection() {
      const now = Date.now();
      
      // Обработка очереди
      const leakElapsedSec = (now - this.lastProcess) / 1000;
      const leaks = Math.floor(leakElapsedSec * this.processRate);
      if (leaks > 0) {
        this.queue.splice(0, Math.min(leaks, this.queue.length));
        this.lastProcess = now;
      }
      
      return { ...this };
    },
    
    update() {
      const now = Date.now();
      
      // Обработка очереди
      const leakElapsedSec = (now - this.lastProcess) / 1000;
      const leaks = Math.floor(leakElapsedSec * this.processRate);
      if (leaks > 0) {
        this.queue.splice(0, Math.min(leaks, this.queue.length));
        this.lastProcess = now;
      }
      
      return { ...this };
    },
    
    reset() {
      this.queue = [];
      this.lastProcess = Date.now();
      return { ...this };
    }
  };
  
  return state;
};
