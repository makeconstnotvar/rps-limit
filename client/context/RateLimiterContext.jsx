import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { useRateLimiter } from '../hooks/useRateLimiter.js';

// Создаем контекст
const RateLimiterContext = createContext(null);

// Провайдер контекста
export function RateLimiterProvider({ children }) {
  const rateLimiterState = useRateLimiter();
  
  return (
    <RateLimiterContext.Provider value={rateLimiterState}>
      {children}
    </RateLimiterContext.Provider>
  );
}

// Хук для использования контекста
export function useRateLimiterContext() {
  const context = useContext(RateLimiterContext);
  if (context === null) {
    throw new Error('useRateLimiterContext должен использоваться внутри RateLimiterProvider');
  }
  return context;
}
