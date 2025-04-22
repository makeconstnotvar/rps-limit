import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import axios from 'axios';
import { Controls } from './components/Controls.jsx';
import { StatsDisplay } from './components/StatsDisplay.jsx';
import { TrafficChart } from './components/TrafficChart.jsx';

export function App() {
  const [algorithm, setAlgorithm] = useState('fixedWindow');
  const [rps, setRps] = useState(6);
  const [rpsLimit, setRpsLimit] = useState(5);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ allowed: 0, denied: 0 });
  const [testRequests, setTestRequests] = useState(10);
  const timer = useRef(null);
  const statsHistory = useRef({});

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

  const changeAlgorithm = async (algo) => {
    setAlgorithm(algo);
    await updateServerConfig();
    setStats({ allowed: 0, denied: 0 });
    statsHistory.current = {};
  };

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
      } else {
        statsHistory.current[currentWindow].allowed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [testRequests]);

  const toggleSimulation = () => {
    if (running) {
      clearInterval(timer.current);
      timer.current = null;
      setRunning(false);
      return;
    }

    setStats({ allowed: 0, denied: 0 });
    statsHistory.current = {};
    const interval = 1000 / rps;

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
          if (key < oldestAllowed) {
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
      } else {
        statsHistory.current[currentWindow].allowed++;
      }
    }, interval);

    setRunning(true);
  };

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

      <div className="row">
        <div className="col-12">
          <TrafficChart stats={statsHistory.current} algorithm={algorithm} rpsLimit={rpsLimit} />
        </div>
      </div>
    </div>
  );
}
