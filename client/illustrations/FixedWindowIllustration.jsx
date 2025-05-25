import { useEffect, useRef, useState } from 'preact/hooks';

export function FixedWindowIllustration({ rpsLimit, rps, running, algorithmState }) {
  const canvasRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const animationFrameRef = useRef(null);
  const lastRequestTimeRef = useRef(0);

  // Константы для анимации
  const WINDOW_DURATION = 10000; // 10 секунд (WINDOW_SIZE)
  const BALL_RADIUS = 10;
  const CONTAINER_HEIGHT = 50; // Уменьшенная высота полосы прогресса
  const CONTAINER_PADDING = 20;

  // Добавление нового запроса
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const now = Date.now();
      lastRequestTimeRef.current = now;

      // Определяем, будет ли запрос принят
      const accepted = algorithmState.count < rpsLimit;

      // Добавляем новый запрос
      setRequests(prev => [
        ...prev,
        {
          id: now,
          x: Math.random() * 0.8 + 0.1, // Позиция по X (от 0.1 до 0.9)
          y: 0, // Начальная позиция по Y
          velocity: 0, // Начальная скорость
          accepted,
          created: now
        }
      ]);
    }, 1000 / rps);

    return () => clearInterval(interval);
  }, [running, rps, rpsLimit, algorithmState]);

  // Анимация
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gravity = 0.5; // Гравитация для анимации падения

    function animate() {
      const now = Date.now();

      // Очищаем холст
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Рисуем контейнер
      const containerWidth = canvas.width - 2 * CONTAINER_PADDING;
      const containerTop = canvas.height - CONTAINER_HEIGHT - CONTAINER_PADDING;

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        CONTAINER_PADDING,
        containerTop,
        containerWidth,
        CONTAINER_HEIGHT
      );

      // Рисуем прогресс окна
      const elapsed = now - algorithmState.windowStart;
      const progress = Math.min(1, elapsed / WINDOW_DURATION);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(
        CONTAINER_PADDING,
        containerTop,
        containerWidth * progress,
        CONTAINER_HEIGHT
      );

      // Рисуем счетчик
      ctx.fillStyle = algorithmState.count > rpsLimit ? 'red' : '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${algorithmState.count} / ${rpsLimit}`,
        canvas.width / 2,
        containerTop + CONTAINER_HEIGHT / 2
      );

      // Рисуем таймер
      const timeLeft = Math.max(0, WINDOW_DURATION - elapsed);
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.fillText(
        `Сброс через: ${(timeLeft / 1000).toFixed(1)}с`,
        canvas.width / 2,
        containerTop + CONTAINER_HEIGHT + 20
      );

      // Обновляем и рисуем запросы
      const updatedRequests = requests
          .map(req => {
            // Физика движения
            let { x, y, velocity, accepted } = req;

            // Преобразуем относительные координаты в абсолютные
            const absX = CONTAINER_PADDING + x * containerWidth;

            // Позиция верхней границы контейнера
            const containerY = containerTop - BALL_RADIUS;

            // Если запрос принят и достиг контейнера, пропускаем его через окно
            if (accepted && y >= containerY) {
              // Увеличиваем скорость для пролета вниз
              return { ...req, velocity: velocity + 1 };
            }

            // Если запрос отклонен и достиг контейнера, останавливаем его
            if (!accepted && y >= containerY) {
              return {
                ...req,
                y: containerY,
                velocity: 0 // Останавливаем запрос у окна
              };
            }

            // Применяем гравитацию
            velocity += gravity;
            y += velocity;

            return { ...req, y, velocity };
          })
          .filter(req => {
            // Удаляем старые запросы:
            // - Принятые запросы удаляем через 3 секунды
            // - Отклоненные запросы удаляем через 1.5 секунды после достижения окна
            if (req.accepted) {
              return now - req.created < 3000;
            } else {
              // Если запрос отклонен и достиг окна, начинаем отсчет времени до удаления
              const hasReachedWindow = req.y >= containerTop - BALL_RADIUS && req.velocity === 0;
              return !hasReachedWindow || now - req.created < 1500;
            }
          });

      // Обновляем состояние
      setRequests(updatedRequests);

      // Рисуем запросы
      updatedRequests.forEach(req => {
        const absX = CONTAINER_PADDING + req.x * containerWidth;

        ctx.beginPath();
        ctx.arc(absX, req.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = req.accepted ? 'limegreen' : 'tomato';
        ctx.fill();
        ctx.closePath();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [requests, algorithmState, rpsLimit]);

  // Обновляем размер холста при изменении размера окна
  useEffect(() => {
    function handleResize() {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = 300;
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="illustration">
      <h3 className="illustration__title">🪟 Fixed Window</h3>
      <div className="illustration__canvas-container">
        <canvas ref={canvasRef} className="illustration__canvas" />
      </div>
      <p className="illustration__description">
        Простой подсчет запросов в фиксированном временном окне.
        При истечении окна счетчик сбрасывается.
      </p>
    </div>
  );
}
