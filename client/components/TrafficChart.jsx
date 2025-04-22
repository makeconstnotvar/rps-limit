import { useEffect, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';

export function TrafficChart({ stats, algorithm, rpsLimit }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Защита от отсутствия DOM элемента
    if (!chartRef.current) {
      return;
    }

    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Надежная проверка наличия данных
    if (!stats || typeof stats !== 'object' || Object.keys(stats).length === 0) {
      console.log('Нет данных для графика:', stats);
      return;
    }

    try {
      // Преобразуем объект статистики в массивы для графика
      const windows = Object.values(stats);
      if (!Array.isArray(windows) || windows.length === 0) {
        console.log('Пустой массив данных:', windows);
        return;
      }

      // Сортируем окна по временной метке
      windows.sort((a, b) => a.timestamp - b.timestamp);

      const labels = windows.map(w => {
        if (!w || typeof w.timestamp !== 'number') {
          return 'Invalid';
        }
        const date = new Date(w.timestamp * 1000);
        return date.toLocaleTimeString();
      });

      const allowedData = windows.map(w => w?.allowed || 0);
      const deniedData = windows.map(w => w?.denied || 0);

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
                  if (!context || !context[0] || !context[1]) {
                    return 'Нет данных';
                  }

                  const allowedValue = context[0].parsed.y || 0;
                  const deniedValue = context[1].parsed.y || 0;
                  const total = allowedValue + deniedValue;
                  return `Всего: ${total}\nЛимит: ${rpsLimit}`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Ошибка при построении графика:', error);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats, rpsLimit]);

  // Добавляем проверку для отладки
  useEffect(() => {
    console.log('TrafficChart получил данные:', stats);
    console.log('Количество точек данных:', Object.keys(stats || {}).length);
  }, [stats]);

  return (
    <div className="card p-3">
      <h3 className="h5 mb-3">📊 Статистика запросов</h3>
      <div style={{height: '400px', position: 'relative'}}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}