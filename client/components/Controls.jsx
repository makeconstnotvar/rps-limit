export function Controls({
  algorithm, 
  onAlgorithmChange, 
  rps, 
  setRps, 
  rpsLimit, 
  setRpsLimit, 
  running, 
  onToggle,
  testRequests,
  setTestRequests,
  onTestRun
}) {
  return (
    <div className="card p-3 mb-3">
      <div className="mb-3">
        <label className="form-label">Алгоритм: </label>
        <select
          className="form-select"
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value)}
        >
          <option value="fixedWindow">Fixed Window</option>
          <option value="slidingLog">Sliding Log</option>
          <option value="slidingCounter">Sliding Counter</option>
          <option value="tokenBucket">Token Bucket</option>
          <option value="leakyBucket">Leaky Bucket</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Нагрузка RPS: {rps}</label>
        <div className="d-flex align-items-center gap-3">
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={rps}
            className="form-range"
            onInput={(e) => setRps(Number(e.target.value))}
            onChange={(e) => setRps(Number(e.target.value))}
          />
          <input
            type="number" 
            min="1" 
            max="100" 
            value={rps} 
            className="form-control w-25"
            onChange={(e) => {
              const value = Number(e.target.value);
              setRps(Math.min(Math.max(1, value), 100));
            }}
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Лимит RPS: {rpsLimit}</label>
        <div className="d-flex align-items-center gap-3">
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={rpsLimit}
            className="form-range"
            onInput={(e) => setRpsLimit(Number(e.target.value))}
            onChange={(e) => setRpsLimit(Number(e.target.value))}
          />
          <input
            type="number" 
            min="1" 
            max="100" 
            value={rpsLimit} 
            className="form-control w-25"
            onChange={(e) => {
              const value = Number(e.target.value);
              setRpsLimit(Math.min(Math.max(1, value), 100));
            }}
          />
        </div>
      </div>
      <button 
        onClick={onToggle} 
        className={`btn ${running ? 'btn-danger' : 'btn-primary'} mb-3 w-100`}
      >
        {running ? '🛑 Остановить' : '▶️ Запустить'}
      </button>

      <div className="mb-3">
        <label className="form-label">Тестовый запуск (кол-во запросов):</label>
        <div className="d-flex align-items-center gap-3">
          <button 
            onClick={onTestRun} 
            className="btn btn-secondary" 
            disabled={running}
          >
            🚀 Запустить тест
          </button>
          <input
            type="number"
            min="1"
            max="10"
            value={testRequests}
            className="form-control w-25"
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                const numValue = Number(value);
                setTestRequests(Math.min(Math.max(1, numValue), 10));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
