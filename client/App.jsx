import {useEffect, useRef, useState} from 'preact/hooks';
import axios from 'axios';
import {Controls} from './components/Controls.jsx';
import {StatsDisplay} from './components/StatsDisplay.jsx';
import {TrafficChart} from './components/TrafficChart.jsx';
import {VisualBucket} from "./components/VisualBucket.jsx";

export function App() {
  const [algorithm, setAlgorithm] = useState('fixedWindow');
  const [rps, setRps] = useState(6);
  const [rpsLimit, setRpsLimit] = useState(5);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({allowed: 0, denied: 0});
  const timer = useRef(null);
  const stateTimer = useRef(null);
  const [state, setState] = useState({});

  const changeAlgorithm = async (algo) => {
    setAlgorithm(algo);
    try {
      await axios.post('http://localhost:3000/api/algorithm', {
        algorithm: algo,
        rpsLimit: algo === 'fixedWindow' ? rpsLimit : undefined
      });
      setStats({allowed: 0, denied: 0});

      // Получаем актуальное состояние при смене алгоритма
      if (running) {
        await fetchState();
      }
    } catch (error) {
      console.error('Ошибка при смене алгоритма:', error);
    }
  };

  useEffect(() => {
    if (algorithm === 'fixedWindow') {
      axios.post('http://localhost:3000/api/algorithm', {
        algorithm,
        rpsLimit
      }).catch(error => {
        console.error('Ошибка при обновлении лимита RPS:', error);
      });
    }
  }, [rpsLimit, algorithm]);

  const toggleSimulation = async () => {
    if (running) {
      // Останавливаем симуляцию на клиенте
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }

      if (stateTimer.current) {
        clearInterval(stateTimer.current);
        stateTimer.current = null;
      }

      setRunning(false);
    } else {
      // Сбрасываем статистику при старте
      setStats({allowed: 0, denied: 0});

      // Запускаем симуляцию на клиенте
      const interval = 1000 / rps;

      timer.current = setInterval(() => {
        axios.get(`http://localhost:3000/api/test`)
          .then(() => {
            // Засчитываем разрешенный запрос
            setStats(prevStats => ({
              ...prevStats,
              allowed: prevStats.allowed + 1
            }));
          })
          .catch(error => {
            // Проверяем, был ли запрос заблокирован из-за rate limiting
            if (error.response && error.response.status === 429) {
              // Засчитываем заблокированный запрос
              setStats(prevStats => ({
                ...prevStats,
                denied: prevStats.denied + 1
              }));
            }
          });
      }, interval);

      setRunning(true);
    }
  };

  return (
    <div className="app">
      <h1 className="app__title">🚦 Rate Limiter Playground</h1>

      <Controls
        algorithm={algorithm}
        onAlgorithmChange={changeAlgorithm}
        rps={rps}
        setRps={setRps}
        rpsLimit={rpsLimit}
        setRpsLimit={setRpsLimit}
        running={running}
        onToggle={toggleSimulation}
      />
      <VisualBucket algorithm={algorithm} state={state}/>
      <StatsDisplay stats={stats}/>
      <TrafficChart stats={stats} algorithm={algorithm} rpsLimit={rpsLimit}/>
    </div>
  );
}