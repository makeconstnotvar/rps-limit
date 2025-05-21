// Интерфейс для алгоритмов ограничения скорости
import { WINDOW_SIZE } from './constants.js';

export const createAlgorithmState = (rpsLimit) => {
  return {
    // Базовые параметры, общие для всех алгоритмов
    windowSize: WINDOW_SIZE, // 10 секунд
    limit: rpsLimit,
    
    // Метод для обновления состояния при успешном запросе
    handleRequest: () => {
      throw new Error('handleRequest должен быть реализован в конкретном алгоритме');
    },
    
    // Метод для обновления состояния при отклоненном запросе
    handleRejection: () => {
      throw new Error('handleRejection должен быть реализован в конкретном алгоритме');
    },
    
    // Метод для периодического обновления состояния (для анимаций)
    update: () => {
      throw new Error('update должен быть реализован в конкретном алгоритме');
    },
    
    // Метод для сброса состояния
    reset: () => {
      throw new Error('reset должен быть реализован в конкретном алгоритме');
    }
  };
};
