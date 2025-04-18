export function StatsDisplay({ stats }) {
  return (
    <div className="stats-display">
      <h3 className="stats-display__title">📊 Статистика</h3>
      <p className="stats-display__stat">✅ Разрешено: <strong>{stats.allowed}</strong></p>
      <p className="stats-display__stat">❌ Отклонено: <strong>{stats.denied}</strong></p>
    </div>
  );
}