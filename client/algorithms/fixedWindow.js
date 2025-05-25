import { WINDOW_SIZE } from './constants.js';
import { createAlgorithmState } from './algorithmInterface.js';

export const createFixedWindowState = (rpsLimit) => {
  const state = {
    ...createAlgorithmState(rpsLimit),
    windowStart: Date.now(),
    count: 0,
    
    handleRequest() {
      const now = Date.now();
      
      // Проверяем, нужно ли сбросить окно
      if (now - this.windowStart > this.windowSize) {
        this.windowStart = now;
        this.count = 1; // Текущий запрос
      } else {
        this.count++;
      }
      
      return { ...this };
    },
    
    handleRejection() {
      const now = Date.now();
      
      // Проверяем, нужно ли сбросить окно
      if (now - this.windowStart > this.windowSize) {
        this.windowStart = now;
        this.count = 0; // Окно сбрасывается, но запрос отклонен
      }
      
      return { ...this };
    },
    
    update() {
      const now = Date.now();
      
      // Проверяем, нужно ли сбросить окно
      if (now - this.windowStart > this.windowSize) {
        this.windowStart = now;
        this.count = 0;
      }
      
      return { ...this };
    },
    
    reset() {
      this.windowStart = Date.now();
      this.count = 0;
      return { ...this };
    }
  };
  
  return state;
};
