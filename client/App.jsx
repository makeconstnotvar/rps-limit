import { Controls } from './components/Controls.jsx';
import { StatsDisplay } from './components/StatsDisplay.jsx';
import { TrafficChart } from './components/TrafficChart.jsx';
import { LimiterVisualizerSwitch } from './illustrations/LimiterVisualizerSwitch.jsx';
import { RateLimiterProvider, useRateLimiterContext } from './context/RateLimiterContext.jsx';

// Внутренний компонент, который использует контекст
function AppContent() {
  const {
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
  } = useRateLimiterContext();

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
              algorithmState={algorithmState}
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

// Основной компонент, который оборачивает контент в провайдер
export function App() {
  return (
    <RateLimiterProvider>
      <AppContent />
    </RateLimiterProvider>
  );
}
