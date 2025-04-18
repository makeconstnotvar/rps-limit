export function Controls({ algorithm, onAlgorithmChange, rps, setRps, rpsLimit, setRpsLimit, running, onToggle }) {
  return (
    <div className="controls">
      <div className="controls__algorithm">
        <label>🧠 Алгоритм: </label>
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
        <label>⚙️ RPS (запросов/сек): {rps}</label>
        <div className="controls__slider-group">
          <input
            type="range"
            min="1"
            max="100"
            value={rps}
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
            type="number"
            min="1"
            max="100"
            value={rps}
            className="controls__input"
            onChange={(e) => {
              const value = Number(e.target.value);
              const clampedValue = Math.min(Math.max(1, value), 100);
              setRps(clampedValue);
            }}
          />
        </div>
      </div>

      {algorithm === 'fixedWindow' && (
        <div className="controls__group">
          <label>🔒 Лимит RPS: {rpsLimit}</label>
          <div className="controls__slider-group">
            <input
              type="range"
              min="1"
              max="100"
              value={rpsLimit}
              className="controls__slider"
              onInput={(e) => {
                const value = Number(e.target.value);
                setRpsLimit(value);
              }}
              onChange={(e) => {
                const value = Number(e.target.value);
                setRpsLimit(value);
              }}
            />
            <input
              type="number"
              min="1"
              max="100"
              value={rpsLimit}
              className="controls__input"
              onChange={(e) => {
                const value = Number(e.target.value);
                const clampedValue = Math.min(Math.max(1, value), 100);
                setRpsLimit(clampedValue);
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        className={`controls__button ${running ? "controls__button--running" : ""}`}
      >
        {running ? '🛑 Остановить' : '▶️ Запустить'}
      </button>
    </div>
  );
}