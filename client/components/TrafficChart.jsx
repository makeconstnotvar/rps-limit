import { useEffect, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';

export function TrafficChart({ stats }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const dataRef = useRef({
    labels: [],
    allowed: [],
    denied: []
  });

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataRef.current.labels,
        datasets: [
          {
            label: '✅ Разрешено',
            data: dataRef.current.allowed,
            fill: false,
            tension: 0.3
          },
          {
            label: '❌ Отклонено',
            data: dataRef.current.denied,
            fill: false,
            tension: 0.3
          }
        ]
      },
      options: {
        animation: false,
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const label = now.toLocaleTimeString().split(' ')[0];

    const { labels, allowed, denied } = dataRef.current;

    labels.push(label);
    allowed.push(stats.allowed);
    denied.push(stats.denied);

    // Сохраняем последние 20 точек
    if (labels.length > 20) {
      labels.shift();
      allowed.shift();
      denied.shift();
    }

    // Проверка наличия chart перед обновлением
    if (chartInstance.current) {
      chartInstance.current.data.labels = [...labels];
      chartInstance.current.data.datasets[0].data = [...allowed];
      chartInstance.current.data.datasets[1].data = [...denied];
      chartInstance.current.update();
    }
  }, [stats]);

  return (
    <div>
      <h3>📈 Динамика запросов</h3>
      <canvas ref={chartRef} width={600} height={300}></canvas>
    </div>
  );
}