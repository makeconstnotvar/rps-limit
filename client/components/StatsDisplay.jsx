export function StatsDisplay({ stats }) {
  return (
    <div className="card p-3">
      <h3 className="h5 mb-3">📊 Статистика</h3>
      <div className="row">
        <div className="col-6 mb-3">
          <div className="p-3 border rounded bg-success bg-opacity-10">
            <div className="text-success">✅ Разрешено:</div>
            <div className="h4">{stats.allowed}</div>
          </div>
        </div>
        <div className="col-6 mb-3">
          <div className="p-3 border rounded bg-danger bg-opacity-10">
            <div className="text-danger">❌ Отклонено:</div>
            <div className="h4">{stats.denied}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
