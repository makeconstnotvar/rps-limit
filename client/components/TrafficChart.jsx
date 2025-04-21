import { useEffect, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';

export function TrafficChart({ stats, algorithm, rpsLimit }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Преобразуем объект статистики в массивы для графика
    const windows = Object.values(stats).sort((a, b) => a.timestamp - b.timestamp);
    const labels = windows.map(w => new Date(w.timestamp * 1000).toLocaleTimeString());
    const allowedData = windows.map(w => w.allowed);
    const deniedData = windows.map(w => w.denied);

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Разрешено',
            data: allowedData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Отклонено', 
            data: deniedData,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Время'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Запросы'
            },
            suggestedMax: rpsLimit * 1.5
          }
        },
        animation: {
          duration: 0 // Отключаем анимацию для мгновенного обновления
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterBody: (context) => {
                const total = context[0].parsed.y + context[1].parsed.y;
                return `Всего: ${total}\nЛимит: ${rpsLimit}`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats, rpsLimit]);

  return (
    <div className="traffic-chart">
      <h3 className="traffic-chart__title">📊 Статистика запросов</h3>
      <div className="traffic-chart__container">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
