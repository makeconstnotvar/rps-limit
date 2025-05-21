import { WINDOW_SIZE } from './constants.js';
import { createAlgorithmState } from './algorithmInterface.js';

export const createSlidingLogState = (rpsLimit) => {
  const state = {
    ...createAlgorithmState(rpsLimit),
    timestamps: [],
    
    handleRequest() {
      const now = Date.now();
      
      // Удаляем устаревшие метки
      this.timestamps = this.timestamps.filter(t => now - t <= this.windowSize);
      
      // Добавляем новую метку
      this.timestamps.push(now);
      
      return { ...this };
    },
    
    handleRejection() {
      const now = Date.now();
      
      // Удаляем устаревшие метки
      this.timestamps = this.timestamps.filter(t => now - t <= this.windowSize);
      
      return { ...this };
    },
    
    update() {
      const now = Date.now();
      
      // Удаляем устаревшие метки
      this.timestamps = this.timestamps.filter(t => now - t <= this.windowSize);
      
      return { ...this };
    },
    
    reset() {
      this.timestamps = [];
      return { ...this };
    }
  };
  
  return state;
};
