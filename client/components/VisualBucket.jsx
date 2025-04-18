import { useEffect, useState } from "preact/hooks";
import axios from "axios";

export function VisualBucket({ algorithm, state }) {
  if (algorithm === 'tokenBucket') {
    const { tokens = 0, maxTokens = 20 } = state;
    const filledPercent = (tokens / maxTokens) * 100;

    return (
      <div className="visual-bucket">
        <h3 className="visual-bucket__title">🎟️ Token Bucket</h3>
        <div className="visual-bucket__token-container">
          <div
            className="visual-bucket__token-level"
            style={{ height: `${filledPercent}%` }}
          />
        </div>
        <p className="visual-bucket__status">{tokens} / {maxTokens} токенов</p>
      </div>
    );
  }

  if (algorithm === 'leakyBucket') {
    const { size = 0, maxSize = 20 } = state;

    return (
      <div className="visual-bucket">
        <h3 className="visual-bucket__title">💧 Leaky Bucket</h3>
        <div className="visual-bucket__leaky-container">
          {Array.from({ length: maxSize }).map((_, i) => (
            <div
              key={i}
              className={`visual-bucket__leaky-item ${i < size ? "visual-bucket__leaky-item--filled" : "visual-bucket__leaky-item--empty"}`}
            />
          ))}
        </div>
        <p className="visual-bucket__status">{size} / {maxSize} в очереди</p>
      </div>
    );
  }

  if (algorithm === 'slidingLog') {
    const { timestamps = [] } = state;
    const maxAge = 60_000;

    return (
      <div className="visual-bucket">
        <h3 className="visual-bucket__title">📜 Sliding Log</h3>
        <div className="visual-bucket__sliding-log">
          {timestamps.map((age, i) => {
            const percent = 100 - (age / maxAge) * 100;
            return (
              <div
                key={i}
                className="visual-bucket__log-mark"
                style={{ left: `${percent}%` }}
              />
            );
          })}
        </div>
        <p className="visual-bucket__status">{timestamps.length} запросов в окне</p>
      </div>
    );
  }

  if (algorithm === 'slidingCounter') {
    const { buckets = [] } = state;
    const maxCount = Math.max(...buckets.map(b => b.count), 1);

    return (
      <div className="visual-bucket">
        <h3 className="visual-bucket__title">🧱 Sliding Counter</h3>
        <div className="visual-bucket__counter-container">
          {buckets.sort((a, b) => a.age - b.age).map((b, i) => (
            <div
              key={i}
              className="visual-bucket__counter-item"
              style={{ height: `${(b.count / maxCount) * 100}%` }}
            >
              {b.count}
            </div>
          ))}
        </div>
        <p className="visual-bucket__status">Запросы по бакетам (10 сек)</p>
      </div>
    );
  }

  return null;
}