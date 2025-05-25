import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import axios from 'axios';
import { WINDOW_SIZE } from '../algorithms/constants.js';
import { 
  createAlgorithmState, 
  handleRequest, 
  handleRejection, 
  updateAlgorithmState as updateState,
  resetAlgorithmState,
  isRateLimited
} from '../algorithms/index.js';

export function useRateLimiter() {
  const [algorithm, setAlgorithm] = useState('fixedWindow');
  const [rps, setRps] = useState(6);
  const [rpsLimit, setRpsLimit] = useState(5);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ allowed: 0, denied: 0 });
  const [testRequests, setTestRequests] = useState(10);
  const [chartData, setChartData] = useState({});
  const [algorithmState, setAlgorithmState] = useState(() => createAlgorithmState(algorithm, rpsLimit));
  
  const timer = useRef(null);
  const statsHistory = useRef({});
  
  // Функция обновления данных графика
  const updateChartData = useCallback(() => {
    setChartData({...statsHistory.current});
  }, []);
  
  // Функция для обновления состояния алгоритма
  const updateAlgorithmState = useCallback((success) => {
    setAlgorithmState(prevState => {
      if (success) {
        return handleRequest(prevState);
      } else {
        return handleRejection(prevState);
      }
    });
  }, []);
  
  // Обновляем алгоритм и лимит на сервере
  const updateServerConfig = useCallback(async () => {
    try {
      await axios.post('http://localhost:3000/api/algorithm', {
        algorithm,
        rpsLimit
      });
    } catch (error) {
      console.error('Ошибка конфигурации:', error);
    }
  }, [algorithm, rpsLimit]);
  
  // Функция для смены алгоритма
  const changeAlgorithm = useCallback(async (algo) => {
    setAlgorithm(algo);
    setStats({ allowed: 0, denied: 0 });
    statsHistory.current = {};
    setChartData({});
    
    // Создаем новое состояние для выбранного алгоритма
    setAlgorithmState(createAlgorithmState(algo, rpsLimit));
    
    // Обновляем конфигурацию на сервере
    await updateServerConfig();
  }, [rpsLimit, updateServerConfig]);
  
  // Обновляем конфигурацию на сервере при изменении лимита
  useEffect(() => {
    updateServerConfig();
    // Обновляем состояние алгоритма при изменении лимита
    setAlgorithmState(prevState => {
      const newState = createAlgorithmState(algorithm, rpsLimit);
      // Копируем динамические свойства из предыдущего состояния, если они есть
      if (prevState) {
        if ('windowStart' in prevState) newState.windowStart = prevState.windowStart;
        if ('count' in prevState) newState.count = prevState.count;
        if ('timestamps' in prevState) newState.timestamps = [...prevState.timestamps];
        if ('buckets' in prevState) newState.buckets = [...prevState.buckets];
        if ('tokens' in prevState) newState.tokens = Math.min(prevState.tokens, rpsLimit);
        if ('queue' in prevState) newState.queue = [...prevState.queue];
      }
      return newState;
    });
  }, [rpsLimit, algorithm, updateServerConfig]);
  
  // Функция для тестового запуска
  const testRun = useCallback(async () => {
    setStats({ allowed: 0, denied: 0 });
    statsHistory.current = {};
    
    // Сбрасываем состояние алгоритма
    setAlgorithmState(prevState => resetAlgorithmState(prevState));
    
    for (let i = 0; i < testRequests; i++) {
      // Обновляем историю для графика
      const now = Date.now();
      const currentWindow = Math.floor(now / 1000); // 1-секундные окна для графика
      
      if (!statsHistory.current[currentWindow]) {
        statsHistory.current[currentWindow] = {
          timestamp: currentWindow,
          allowed: 0,
          denied: 0
        };
      }
      
      // Проверяем, превышен ли лимит запросов
      let requestDenied = false;
      
      // Сначала проверяем состояние алгоритма перед запросом
      setAlgorithmState(prevState => {
        // Для Fixed Window проверяем, превышен ли лимит
        requestDenied = isRateLimited(prevState);
        return prevState;
      });
      
      // Выполняем запрос и обновляем статистику
      try {
        if (!requestDenied) {
          await axios.get(`http://localhost:3000/api/test`);
          setStats(prev => ({...prev, allowed: prev.allowed + 1}));
          statsHistory.current[currentWindow].allowed++;
          updateAlgorithmState(true); // Запрос успешен
        } else {
          setStats(prev => ({...prev, denied: prev.denied + 1}));
          statsHistory.current[currentWindow].denied++;
          updateAlgorithmState(false); // Запрос отклонен
        }
      } catch (error) {
        if (error.response?.status === 429) {
          setStats(prev => ({...prev, denied: prev.denied + 1}));
          statsHistory.current[currentWindow].denied++;
          updateAlgorithmState(false); // Запрос отклонен
        }
      }
      
      // Обновляем данные графика после каждого запроса
      updateChartData();
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [testRequests, updateChartData, updateAlgorithmState]);
  
  // Функция для запуска/остановки симуляции
  const toggleSimulation = useCallback(() => {
    if (running) {
      clearInterval(timer.current);
      timer.current = null;
      setRunning(false);
      return;
    }
    
    setStats({ allowed: 0, denied: 0 });
    statsHistory.current = {};
    updateChartData();
    
    // Сбрасываем состояние алгоритма
    setAlgorithmState(prevState => resetAlgorithmState(prevState));
    
    const interval = 10000 / rps;
    
    timer.current = setInterval(async () => {
      // Обновляем историю для графика в реальном времени
      const now = Date.now();
      const currentWindow = Math.floor(now / 1000); // 1-секундные окна для графика
      
      if (!statsHistory.current[currentWindow]) {
        statsHistory.current[currentWindow] = {
          timestamp: currentWindow,
          allowed: 0,
          denied: 0
        };
        
        // Удаляем старые окна (больше 20 секунд)
        const oldestAllowed = currentWindow - 20;
        Object.keys(statsHistory.current).forEach(key => {
          if (Number(key) < oldestAllowed) {
            delete statsHistory.current[key];
          }
        });
      }
      
      // Проверяем, превышен ли лимит запросов
      let requestDenied = false;
      
      // Сначала проверяем состояние алгоритма перед запросом
      setAlgorithmState(prevState => {
        // Для Fixed Window проверяем, превышен ли лимит
        requestDenied = isRateLimited(prevState);
        return prevState;
      });
      
      // Выполняем запрос и обновляем статистику
      try {
        if (!requestDenied) {
          await axios.get(`http://localhost:3000/api/test`);
          setStats(prev => ({...prev, allowed: prev.allowed + 1}));
          statsHistory.current[currentWindow].allowed++;
          updateAlgorithmState(true); // Запрос успешен
        } else {
          setStats(prev => ({...prev, denied: prev.denied + 1}));
          statsHistory.current[currentWindow].denied++;
          updateAlgorithmState(false); // Запрос отклонен
        }
      } catch (error) {
        if (error.response?.status === 429) {
          setStats(prev => ({...prev, denied: prev.denied + 1}));
          statsHistory.current[currentWindow].denied++;
          updateAlgorithmState(false); // Запрос отклонен
        }
      }
      
      // Обновляем данные графика после каждого запроса
      updateChartData();
    }, interval);
    
    setRunning(true);
  }, [running, rps, updateChartData, updateAlgorithmState]);
  
  // Эффект для периодического обновления состояния алгоритма (для анимаций)
  useEffect(() => {
    if (running) {
      const animationTimer = setInterval(() => {
        setAlgorithmState(prevState => updateState(prevState));
      }, 100); // 10 FPS для плавности анимации
      
      return () => clearInterval(animationTimer);
    }
  }, [running]);
  
  return {
    algorithm,
    rps,
    rpsLimit,
    running,
    stats,
    testRequests,
    chartData,
    algorithmState,
    setRps,
    setRpsLimit,
    setTestRequests,
    changeAlgorithm,
    toggleSimulation,
    testRun
  };
}
