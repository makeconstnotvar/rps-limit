import { useEffect, useRef, useState } from 'preact/hooks';
import axios from 'axios';
import { Controls } from './components/Controls.jsx';
import StatsDisplay from './components/StatsDisplay.jsx';
import { TrafficChart } from './components/TrafficChart.jsx';
import VisualBucket from "./components/VisualBucket";

export function App() {
  const [algorithm, setAlgorithm] = useState('fixedWindow');
  const [rps, setRps] = useState(5);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({allowed: 0, denied: 0});
  const timer = useRef(null);
  const intervalRef = useRef(null);
  const [state, setState] = useState({});

  useEffect(() => {
    if (['fixedWindow', 'tokenBucket'].includes(algorithm)) return;

    // Очистка предыдущего интервала
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/state');
        setState(res.data);
      } catch (error) {
        console.error('Ошибка при получении состояния:', error);
      }
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [algorithm]);

  // Обновление алгоритма
  const changeAlgorithm = async (algo) => {
    setAlgorithm(algo);
    try {
      await axios.post('http://localhost:3000/api/algorithm', {algorithm: algo});
      setStats({allowed: 0, denied: 0});
    } catch (error) {
      console.error('Ошибка при смене алгоритма:', error);
    }
  };

  // Запуск / остановка симуляции
  const toggleSimulation = async () => {
    try {
      if (running) {
        // Останавливаем симуляцию
        await axios.post('http://localhost:3000/api/simulator', {action: 'stop'});
        if (timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
        setRunning(false);
      } else {
        // Запускаем симуляцию
        await axios.post('http://localhost:3000/api/simulator', {action: 'start', rps});
        timer.current = setInterval(fetchStats, 500);
        setRunning(true);
      }
    } catch (error) {
      console.error('Ошибка при управлении симуляцией', error);
      // В случае ошибки тоже сбрасываем состояние
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      setRunning(false);
    }
  };

  // Получение статистики
  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/stats');
      // Обязательно создаем новый объект для триггера перерисовки
      setStats({...res.data});
    } catch (error) {
      console.error('Ошибка при получении статистики', error);
    }
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      axios.post('http://localhost:3000/api/simulator', {action: 'stop'})
        .catch(error => console.error('Ошибка при остановке симуляции:', error));
    };
  }, []);

  return (
    <div style={{padding: '2rem', fontFamily: 'sans-serif'}}>
      <h1>🚦 Rate Limiter Playground</h1>

      <Controls
        algorithm={algorithm}
        onAlgorithmChange={changeAlgorithm}
        rps={rps}
        setRps={setRps}
        running={running}
        onToggle={toggleSimulation}
      />
      <VisualBucket algorithm={algorithm} state={state}/>
      <StatsDisplay stats={stats}/>
      <TrafficChart stats={stats}/>
    </div>
  );
}