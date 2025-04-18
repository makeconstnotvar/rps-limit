export function Controls({ algorithm, onAlgorithmChange, rps, setRps, rpsLimit, setRpsLimit, running, onToggle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div>
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

      <div style={{ marginTop: '1rem' }}>
        <label>⚙️ RPS (запросов/сек): {rps}</label>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
          <input
            type="range"
            min="1"
            max="100"
            value={rps}
            style={{ width: '200px', marginRight: '10px' }}
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
            style={{ width: '60px' }}
            onChange={(e) => {
              const value = Number(e.target.value);
              // Ограничиваем значение между 1 и 100
              const clampedValue = Math.min(Math.max(1, value), 100);
              setRps(clampedValue);
            }}
          />
        </div>
      </div>

      {algorithm === 'fixedWindow' && (
        <div style={{ marginTop: '1rem' }}>
          <label>🔒 Лимит RPS: {rpsLimit}</label>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
            <input
              type="range"
              min="1"
              max="100"
              value={rpsLimit}
              style={{ width: '200px', marginRight: '10px' }}
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
              style={{ width: '60px' }}
              onChange={(e) => {
                const value = Number(e.target.value);
                // Ограничиваем значение между 1 и 100
                const clampedValue = Math.min(Math.max(1, value), 100);
                setRpsLimit(clampedValue);
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
      >
        {running ? '🛑 Остановить' : '▶️ Запустить'}
      </button>
    </div>
  );
}
