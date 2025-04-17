import { useEffect, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';

export function TrafficChart({ stats, algorithm, rpsLimit }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const dataRef = useRef({
    labels: [],
    allowed: [],
    denied: []
  });

  // Plugin to draw horizontal line for RPS limit
  const limitLinePlugin = {
    id: 'limitLine',
    beforeDraw: (chart) => {
      if (algorithm === 'fixedWindow') {
        const { ctx, chartArea, scales } = chart;
        const yScale = scales.y;
        const y = yScale.getPixelForValue(rpsLimit);

        // Only draw if within chart area
        if (y >= chartArea.top && y <= chartArea.bottom) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(chartArea.left, y);
          ctx.lineTo(chartArea.right, y);
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgb(255, 99, 132)';
          ctx.stroke();

          // Add label
          ctx.fillStyle = 'rgb(255, 99, 132)';
          ctx.font = '12px Arial';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('Лимит RPS', chartArea.right, y - 2);

          ctx.restore();
        }
      }
    }
  };

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dataRef.current.labels,
        datasets: [
          {
            label: '✅ Разрешено',
            data: dataRef.current.allowed,
            backgroundColor: (context) => {
              // Change color to red if the value exceeds the limit and algorithm is fixedWindow
              if (algorithm === 'fixedWindow' && context.raw > rpsLimit) {
                return 'rgba(255, 99, 132, 0.7)';
              }
              return 'rgba(75, 192, 192, 0.7)';
            },
            borderColor: (context) => {
              if (algorithm === 'fixedWindow' && context.raw > rpsLimit) {
                return 'rgb(255, 99, 132)';
              }
              return 'rgb(75, 192, 192)';
            },
            borderWidth: 1
          },
          {
            label: '❌ Отклонено',
            data: dataRef.current.denied,
            backgroundColor: 'rgba(255, 159, 64, 0.7)',
            borderColor: 'rgb(255, 159, 64)',
            borderWidth: 1
          }
        ]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 30,
            afterFit: function(scaleInstance) {
              // Limit the height of the y-axis
              scaleInstance.height = 200;
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterTitle: function(context) {
                if (algorithm === 'fixedWindow') {
                  return `Лимит RPS: ${rpsLimit}`;
                }
                return '';
              }
            }
          },
          limitLine: limitLinePlugin
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [algorithm, rpsLimit]);

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

      // Обновляем цвета баров в зависимости от алгоритма и значений
      if (algorithm === 'fixedWindow') {
        chartInstance.current.data.datasets[0].backgroundColor = function(context) {
          if (context.raw > rpsLimit) {
            return 'rgba(255, 99, 132, 0.7)';
          }
          return 'rgba(75, 192, 192, 0.7)';
        };

        chartInstance.current.data.datasets[0].borderColor = function(context) {
          if (context.raw > rpsLimit) {
            return 'rgb(255, 99, 132)';
          }
          return 'rgb(75, 192, 192)';
        };
      } else {
        chartInstance.current.data.datasets[0].backgroundColor = 'rgba(75, 192, 192, 0.7)';
        chartInstance.current.data.datasets[0].borderColor = 'rgb(75, 192, 192)';
      }

      chartInstance.current.update();
    }
  }, [stats, algorithm, rpsLimit]);

  return (
    <div>
      <h3>📈 Динамика запросов</h3>
      <div style={{ height: '300px', width: '100%' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
