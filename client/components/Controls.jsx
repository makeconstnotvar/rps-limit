export function Controls({ algorithm, onAlgorithmChange, rps, setRps, running, onToggle }) {
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
        <label>⚙️ RPS (запросов/сек): </label>
        <input
          type="number"
          min="1"
          value={rps}
          onChange={(e) => setRps(Number(e.target.value))}
        />
      </div>

      <button
        onClick={onToggle}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
      >
        {running ? '🛑 Остановить' : '▶️ Запустить'}
      </button>
    </div>
  );
}