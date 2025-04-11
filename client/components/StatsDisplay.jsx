export default function StatsDisplay({ stats }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>📊 Статистика</h3>
      <p>✅ Разрешено: <strong>{stats.allowed}</strong></p>
      <p>❌ Отклонено: <strong>{stats.denied}</strong></p>
    </div>
  );
}
