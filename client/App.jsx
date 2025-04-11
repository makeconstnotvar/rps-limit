import { useEffect, useState, useRef } from 'preact/hooks';
import axios from 'axios';
import Controls from './components/Controls.jsx';
import StatsDisplay from './components/StatsDisplay.jsx';
import TrafficChart from './components/TrafficChart.jsx';
import VisualBucket from "./components/VisualBucket";

 function App() {
  const [algorithm, setAlgorithm] = useState('fixed');
  const [rps, setRps] = useState(5);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ allowed: 0, denied: 0 });
  const timer = useRef(null);

  // Обновление алгоритма
  const changeAlgorithm = async (algo) => {
    setAlgorithm(algo);
    await axios.post('http://localhost:3000/api/algorithm', { algorithm: algo });
    setStats({ allowed: 0, denied: 0 });
  };

  // Запуск / остановка симуляции
  const toggleSimulation = async () => {
    if (running) {
      await axios.post('http://localhost:3000/api/simulator', { action: 'stop' });
      clearInterval(timer.current);
      setRunning(false);
    } else {
      await axios.post('http://localhost:3000/api/simulator', { action: 'start', rps });
      timer.current = setInterval(fetchStats, 500);
      setRunning(true);
    }
  };

  // Получение статистики
  const fetchStats = async () => {
    const res = await axios.get('http://localhost:3000/api/stats');
    setStats(res.data);
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      clearInterval(timer.current);
      axios.post('http://localhost:3000/api/simulator', { action: 'stop' });
    };
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🚦 Rate Limiter Playground</h1>

      <Controls
        algorithm={algorithm}
        onAlgorithmChange={changeAlgorithm}
        rps={rps}
        setRps={setRps}
        running={running}
        onToggle={toggleSimulation}
      />
      <VisualBucket algorithm={algorithm} />
      <StatsDisplay stats={stats} />
      <TrafficChart stats={stats} />
    </div>
  );
}
export {App}