import { useEffect, useState } from "preact/hooks";
import axios from "axios";
import slidingLog from "../../server/slidingLog.js";
import slidingCounter from "../../server/slidingCounter.js";

export default function VisualBucket({ algorithm }) {
  const [state, setState] = useState({});

  useEffect(() => {
    if (!['tokenBucket', 'leakyBucket'].includes(algorithm)) return;

    const interval = setInterval(async () => {
      const res = await axios.get('http://localhost:3000/api/state');
      setState(res.data);
    }, 500);

    return () => clearInterval(interval);
  }, [algorithm]);

  if (algorithm === 'tokenBucket') {
    const { tokens = 0, maxTokens = 20 } = state;
    const filledPercent = (tokens / maxTokens) * 100;

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>🎟️ Token Bucket</h3>
        <div
          style={{
            width: '100px',
            height: '200px',
            border: '2px solid black',
            position: 'relative',
            margin: '0 auto',
            background: '#eee'
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: `${filledPercent}%`,
              background: 'limegreen',
              transition: 'height 0.2s ease-out'
            }}
          />
        </div>
        <p style={{ textAlign: 'center' }}>{tokens} / {maxTokens} токенов</p>
      </div>
    );
  }

  if (algorithm === 'leakyBucket') {
    const { size = 0, maxSize = 20 } = state;

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>💧 Leaky Bucket</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap', maxWidth: '220px', margin: '0 auto' }}>
          {Array.from({ length: maxSize }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '20px',
                height: '20px',
                border: '1px solid #aaa',
                background: i < size ? 'dodgerblue' : '#eee'
              }}
            />
          ))}
        </div>
        <p style={{ textAlign: 'center' }}>{size} / {maxSize} в очереди</p>
      </div>
    );
  }
  if (algorithm === 'slidingLog') {
    const { timestamps = [] } = state;
    const maxAge = 60_000;

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>📜 Sliding Log</h3>
        <div
          style={{
            position: 'relative',
            height: '40px',
            border: '1px solid #aaa',
            margin: '0 auto',
            width: '100%',
            maxWidth: '600px',
            background: '#f9f9f9'
          }}
        >
          {timestamps.map((age, i) => {
            const percent = 100 - (age / maxAge) * 100;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${percent}%`,
                  top: '10px',
                  width: '6px',
                  height: '20px',
                  background: 'tomato'
                }}
              />
            );
          })}
        </div>
        <p style={{ textAlign: 'center' }}>{timestamps.length} запросов в окне</p>
      </div>
    );
  }
  if (algorithm === 'slidingCounter') {
    const { buckets = [] } = state;

    const maxCount = Math.max(...buckets.map(b => b.count), 1);

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>🧱 Sliding Counter</h3>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: '4px',
          height: '100px',
          marginBottom: '0.5rem'
        }}>
          {buckets.sort((a, b) => a.age - b.age).map((b, i) => (
            <div key={i} style={{
              width: '30px',
              height: `${(b.count / maxCount) * 100}%`,
              background: '#6495ED',
              textAlign: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              {b.count}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center' }}>Запросы по бакетам (10 сек)</p>
      </div>
    );
  }
  return null;
}
