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

    // Проверяем, что stats не пустой
    if (!stats || Object.keys(stats).length === 0) {
      return;
    }

    // Преобразуем объект статистики в массивы для графика
    const windows = Object.values(stats);
    if (windows.length === 0) return;

    // Сортируем окна по временной метке
    windows.sort((a, b) => a.timestamp - b.timestamp);

    const labels = windows.map(w => {
      const date = new Date(w.timestamp * 1000);
      return date.toLocaleTimeString();
    });

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
    <div className="card p-3">
      <h3 className="h5 mb-3">📊 Статистика запросов</h3>
      <div style={{height: '400px', position: 'relative'}}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}