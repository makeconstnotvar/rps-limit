import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import axios from 'axios';
import { Controls } from './components/Controls.jsx';
import { StatsDisplay } from './components/StatsDisplay.jsx';
import { TrafficChart } from './components/TrafficChart.jsx';
import { LimiterVisualizerSwitch } from './illustrations/LimiterVisualizerSwitch.jsx';

export function App() {
  const [algorithm, setAlgorithm] = useState('fixedWindow');
  const [rps, setRps] = useState(6);
  const [rpsLimit, setRpsLimit] = useState(5);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ allowed: 0, denied: 0 });
  const [testRequests, setTestRequests] = useState(10);
  const [chartData, setChartData] = useState({}); // Новый state для данных графика
  const timer = useRef(null);
  const statsHistory = useRef({});
  
  // Состояние алгоритмов для визуализации
  const [algorithmStates, setAlgorithmStates] = useState({
      fixedWindow: {
        windowStart: Date.now(),
        windowSize: 10000,
      count: 0,
      limit: rpsLimit
    },
    slidingLog: {
      timestamps: [],
      windowSize: 10000,
      limit: rpsLimit
    },
    slidingCounter: {
      buckets: [],
      bucketSize: 100,
      windowSize: 10000,
      limit: rpsLimit
    },
    tokenBucket: {
      tokens: rpsLimit,
      maxTokens: rpsLimit,
      refillRate: rpsLimit,
      lastRefill: Date.now()
    },
    leakyBucket: {
      queue: [],
      maxSize: rpsLimit,
      processRate: rpsLimit,
      lastProcess: Date.now()
    }
  });

  // Функция обновления данных графика
  const updateChartData = useCallback(() => {
    // Создаем КОПИЮ объекта, а не передаем ссылку
    setChartData({...statsHistory.current});
  }, []);
  
  // Функция для обновления состояния алгоритмов
  const updateAlgorithmState = useCallback((success) => {
    const now = Date.now();
    
    setAlgorithmStates(prev => {
      const newState = {...prev};
      
      // Fixed Window
      const fw = newState.fixedWindow;
      if (now - fw.windowStart > fw.windowSize) {
        fw.windowStart = now;
        fw.count = success ? 1 : 0;
      } else if (success) {
        fw.count++;
      }
      
      // Sliding Log
      const sl = newState.slidingLog;
      // Удаляем устаревшие метки
      sl.timestamps = sl.timestamps.filter(t => now - t <= sl.windowSize);
      if (success) {
        sl.timestamps.push(now);
      }
      
      // Sliding Counter
      const sc = newState.slidingCounter;
      const currentBucket = Math.floor(now / sc.bucketSize);
      // Очищаем старые бакеты
      sc.buckets = sc.buckets.filter(b => 
        (currentBucket - b.id) * sc.bucketSize <= sc.windowSize
      );
      // Увеличиваем счетчик текущего бакета
      const bucketIndex = sc.buckets.findIndex(b => b.id === currentBucket);
      if (bucketIndex >= 0 && success) {
        sc.buckets[bucketIndex].count++;
      } else if (success) {
        sc.buckets.push({ id: currentBucket, count: 1 });
      } else if (bucketIndex < 0) {
        sc.buckets.push({ id: currentBucket, count: 0 });
      }
      
      // Token Bucket
      const tb = newState.tokenBucket;
      // Пополнение токенов
      const elapsedSec = (now - tb.lastRefill) / 1000;
      const refill = Math.floor(elapsedSec * tb.refillRate);
      if (refill > 0) {
        tb.tokens = Math.min(tb.maxTokens, tb.tokens + refill);
        tb.lastRefill = now;
      }
      // Расход токена при успешном запросе
      if (success) {
        tb.tokens = Math.max(0, tb.tokens - 1);
      }
      
      // Leaky Bucket
      const lb = newState.leakyBucket;
      // Обработка очереди
      const leakElapsedSec = (now - lb.lastProcess) / 1000;
      const leaks = Math.floor(leakElapsedSec * lb.processRate);
      if (leaks > 0) {
        lb.queue.splice(0, Math.min(leaks, lb.queue.length));
        lb.lastProcess = now;
      }
      // Добавление в очередь при успешном запросе
      if (success) {
        lb.queue.push(now);
      }
      
      return newState;
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

  // Исправлено: определена функция changeAlgorithm
  const changeAlgorithm = useCallback(async (algo) => {
    setAlgorithm(algo);
    await updateServerConfig();
    setStats({ allowed: 0, denied: 0 });
    statsHistory.current = {};
    setChartData({}); // Очищаем также данные графика
    
    // Сбрасываем состояние алгоритмов при смене алгоритма
    setAlgorithmStates(prev => {
      const newState = {...prev};
      const now = Date.now();
      
      newState.fixedWindow = {
        windowStart: now,
        windowSize: 10000,
        count: 0,
        limit: rpsLimit
      };
      
      newState.slidingLog = {
        timestamps: [],
        windowSize: 10000,
        limit: rpsLimit
      };
      
      newState.slidingCounter = {
        buckets: [],
        bucketSize: 100,
        windowSize: 10000,
        limit: rpsLimit
      };
      
      newState.tokenBucket = {
        tokens: rpsLimit,
        maxTokens: rpsLimit,
        refillRate: rpsLimit,
        lastRefill: now
      };
      
      newState.leakyBucket = {
        queue: [],
        maxSize: rpsLimit,
        processRate: rpsLimit,
        lastProcess: now
      };
      
      return newState;
    });
  }, [updateServerConfig, rpsLimit]);

  useEffect(() => {
    updateServerConfig();
  }, [rpsLimit, updateServerConfig]);

  const testRun = useCallback(async () => {
    setStats({ allowed: 0, denied: 0 });
    statsHistory.current = {};

    for (let i = 0; i < testRequests; i++) {
      // Обновляем историю для графика
      const now = Date.now();
      const currentWindow = Math.floor(now / 1000);

      if (!statsHistory.current[currentWindow]) {
        statsHistory.current[currentWindow] = {
          timestamp: currentWindow,
          allowed: 0,
          denied: 0
        };
      }

      // Выполняем запрос и обновляем статистику
      let requestDenied = false;
      try {
        await axios.get(`http://localhost:3000/api/test`);
        setStats(prev => ({...prev, allowed: prev.allowed + 1}));
      } catch (error) {
        if (error.response?.status === 429) {
          setStats(prev => ({...prev, denied: prev.denied + 1}));
          requestDenied = true;
        }
      }

      // Обновляем статистику в текущем окне
      if (requestDenied) {
        statsHistory.current[currentWindow].denied++;
        updateAlgorithmState(false); // Запрос отклонен
      } else {
        statsHistory.current[currentWindow].allowed++;
        updateAlgorithmState(true); // Запрос успешен
      }

      // Обновляем данные графика после каждого запроса
      updateChartData();

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [testRequests, updateChartData, updateAlgorithmState]);

  const toggleSimulation = () => {
    if (running) {
      clearInterval(timer.current);
      timer.current = null;
      setRunning(false);
      return;
    }

    setStats({ allowed: 0, denied: 0 });
    statsHistory.current = {};
    updateChartData(); // Очищаем график
    const interval = 10000 / rps;

    timer.current = setInterval(async () => {
      // Обновляем историю для графика в реальном времени
      const now = Date.now();
      const currentWindow = Math.floor(now / 1000); // 1-секундные окна

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

      // Выполняем запрос и обновляем статистику
      let requestDenied = false;
      try {
        await axios.get(`http://localhost:3000/api/test`);
        setStats(prev => ({...prev, allowed: prev.allowed + 1}));
      } catch (error) {
        if (error.response?.status === 429) {
          setStats(prev => ({...prev, denied: prev.denied + 1}));
          requestDenied = true;
        }
      }

      // Обновляем статистику в текущем окне
      if (requestDenied) {
        statsHistory.current[currentWindow].denied++;
        updateAlgorithmState(false); // Запрос отклонен
      } else {
        statsHistory.current[currentWindow].allowed++;
        updateAlgorithmState(true); // Запрос успешен
      }

      // Обновляем данные графика после каждого запроса
      updateChartData();
    }, interval);

    setRunning(true);
  };
  
  // Эффект для периодического обновления состояния алгоритмов (для анимаций)
  useEffect(() => {
    if (running) {
      const animationTimer = setInterval(() => {
        setAlgorithmStates(prev => {
          const now = Date.now();
          const newState = {...prev};
          
          // Fixed Window
          const fw = newState.fixedWindow;
          if (now - fw.windowStart > fw.windowSize) {
            fw.windowStart = now;
            fw.count = 0;
          }
          
          // Sliding Log
          const sl = newState.slidingLog;
          sl.timestamps = sl.timestamps.filter(t => now - t <= sl.windowSize);
          
          // Sliding Counter
          const sc = newState.slidingCounter;
          const currentBucket = Math.floor(now / sc.bucketSize);
          sc.buckets = sc.buckets.filter(b => 
            (currentBucket - b.id) * sc.bucketSize <= sc.windowSize
          );
          
          // Token Bucket
          const tb = newState.tokenBucket;
          const elapsedSec = (now - tb.lastRefill) / 1000;
          const refill = Math.floor(elapsedSec * tb.refillRate);
          if (refill > 0) {
            tb.tokens = Math.min(tb.maxTokens, tb.tokens + refill);
            tb.lastRefill = now;
          }
          
          // Leaky Bucket
          const lb = newState.leakyBucket;
          const leakElapsedSec = (now - lb.lastProcess) / 1000;
          const leaks = Math.floor(leakElapsedSec * lb.processRate);
          if (leaks > 0) {
            lb.queue.splice(0, Math.min(leaks, lb.queue.length));
            lb.lastProcess = now;
          }
          
          return newState;
        });
      }, 100); // 10 FPS для плавности анимации
      
      return () => clearInterval(animationTimer);
    }
  }, [running]);

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">🚦 Rate Limiter Playground</h1>

      <div className="row">
        <div className="col-md-6 mb-4">
          <Controls
            algorithm={algorithm}
            onAlgorithmChange={changeAlgorithm}
            rps={rps}
            setRps={setRps}
            rpsLimit={rpsLimit}
            setRpsLimit={setRpsLimit}
            running={running}
            onToggle={toggleSimulation}
            testRequests={testRequests}
            setTestRequests={setTestRequests}
            onTestRun={testRun}
          />
        </div>
        <div className="col-md-6 mb-4">
          <StatsDisplay stats={stats} />
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-12">
          <div className="card p-3">
            <h3 className="h5 mb-3">🎮 Визуализация алгоритма</h3>
            <LimiterVisualizerSwitch 
              algorithm={algorithm} 
              rpsLimit={rpsLimit} 
              rps={rps}
              running={running}
            />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <TrafficChart stats={chartData} algorithm={algorithm} rpsLimit={rpsLimit} />
        </div>
      </div>
    </div>
  );
}
