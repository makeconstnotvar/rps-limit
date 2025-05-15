import { createAlgorithmState } from './algorithmInterface.js';

export const createSlidingCounterState = (rpsLimit) => {
  const state = {
    ...createAlgorithmState(rpsLimit),
    buckets: [],
    bucketSize: 100, // 100 мс
    
    handleRequest() {
      const now = Date.now();
      const currentBucket = Math.floor(now / this.bucketSize);
      
      // Очищаем старые бакеты
      this.buckets = this.buckets.filter(b => 
        (currentBucket - b.id) * this.bucketSize <= this.windowSize
      );
      
      // Увеличиваем счетчик текущего бакета
      const bucketIndex = this.buckets.findIndex(b => b.id === currentBucket);
      if (bucketIndex >= 0) {
        this.buckets[bucketIndex].count++;
      } else {
        this.buckets.push({ id: currentBucket, count: 1 });
      }
      
      return { ...this };
    },
    
    handleRejection() {
      const now = Date.now();
      const currentBucket = Math.floor(now / this.bucketSize);
      
      // Очищаем старые бакеты
      this.buckets = this.buckets.filter(b => 
        (currentBucket - b.id) * this.bucketSize <= this.windowSize
      );
      
      // Добавляем текущий бакет, если его нет
      const bucketIndex = this.buckets.findIndex(b => b.id === currentBucket);
      if (bucketIndex < 0) {
        this.buckets.push({ id: currentBucket, count: 0 });
      }
      
      return { ...this };
    },
    
    update() {
      const now = Date.now();
      const currentBucket = Math.floor(now / this.bucketSize);
      
      // Очищаем старые бакеты
      this.buckets = this.buckets.filter(b => 
        (currentBucket - b.id) * this.bucketSize <= this.windowSize
      );
      
      return { ...this };
    },
    
    reset() {
      this.buckets = [];
      return { ...this };
    }
  };
  
  return state;
};
