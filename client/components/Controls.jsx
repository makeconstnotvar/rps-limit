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
    <div className="controls">
      <div className="controls__algorithm">
        <label>Алгоритм: </label>
        <select
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
      <div className="controls__group">
        <label>Нагрузка RPS: {rps}</label>
        <div className="controls__slider-group">
          <input type="range" min="1" max="100" value={rps}
                 className="controls__slider"
                 onInput={(e) => {
                   const value = Number(e.target.value);
                   setRps(value);
                 }}
                 onChange={(e) => {
                   const value = Number(e.target.value);
                   setRps(value);
                 }}
          />
          <input
            type="number" min="1" max="100" value={rps} className="controls__input"
            onChange={(e) => {
              const value = Number(e.target.value);
              const clampedValue = Math.min(Math.max(1, value), 100);
              setRps(clampedValue);
            }}
          />
        </div>
      </div>
      <div className="controls__group">
        <label>Лимит RPS: {rpsLimit}</label>
        <div className="controls__slider-group">
          <input type="range" min="1" max="100" value={rpsLimit} className="controls__slider"
                 onInput={(e) => {
                   const value = Number(e.target.value);
                   setRpsLimit(value);
                 }}
                 onChange={(e) => {
                   const value = Number(e.target.value);
                   setRpsLimit(value);
                 }}/>
          <input type="number" min="1" max="100" value={rpsLimit} className="controls__input"
                 onChange={(e) => {
                   const value = Number(e.target.value);
                   const clampedValue = Math.min(Math.max(1, value), 100);
                   setRpsLimit(clampedValue);
                 }}/>
        </div>
      </div>
      <button onClick={onToggle} className={`controls__button ${running ? "controls__button--running" : ""}`}>
        {running ? '🛑 Остановить' : '▶️ Запустить'}
      </button>
      <div className="controls__group">
        <label>Тестовый запуск (кол-во запросов):</label>
        <div className="controls__slider-group">
          <button onClick={onTestRun} className="controls__button" disabled={running}>🚀 Запустить тест</button>
          <input
            type="text"
            value={testRequests}
            className="controls__input"
            onChange={(e) => {
              const value = e.target.value;
              // Проверяем, что введено число
              if (/^\d*$/.test(value)) {
                const numValue = Number(value);
                const clampedValue = Math.min(Math.max(1, numValue), 10);
                setTestRequests(clampedValue);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
