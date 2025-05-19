import { useEffect, useRef, useState } from 'preact/hooks';

export function FixedWindowIllustration({ rpsLimit, rps, running, algorithmState }) {
  const canvasRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const animationFrameRef = useRef(null);

  // Константы для анимации
  const WINDOW_DURATION = 10000; // 10 секунд
  const BALL_RADIUS = 10;
  const CONTAINER_HEIGHT = 150;
  const CONTAINER_PADDING = 40;

  // Добавление нового запроса
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Получаем данные из состояния алгоритма
      const count = algorithmState && 'count' in algorithmState
        ? algorithmState.count
        : 0;

      // Определяем, будет ли запрос принят
      const accepted = count < rpsLimit;

      // Добавляем новый запрос со случайной позицией по X
      setRequests(prev => [
        ...prev,
        {
          id: now,
          x: Math.random() * 0.8 + 0.1, // Позиция по X (от 0.1 до 0.9)
          y: -BALL_RADIUS * 2, // Начальная позиция над верхней границей холста
          velocity: 2, // Начальная скорость падения
          accepted,
          created: now
        }
      ]);
    }, 10000 / rps);

    return () => clearInterval(interval);
  }, [running, rps, rpsLimit, algorithmState]);

  // Анимация
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gravity = 0.3; // Гравитация для анимации падения

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

      // Получаем данные из состояния алгоритма
      const windowStart = algorithmState && 'windowStart' in algorithmState
        ? algorithmState.windowStart
        : now;
      const count = algorithmState && 'count' in algorithmState
        ? algorithmState.count
        : 0;

      // Рисуем прогресс окна
      const elapsed = now - windowStart;
      const progress = Math.min(1, elapsed / WINDOW_DURATION);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(
        CONTAINER_PADDING,
        containerTop,
        containerWidth * progress,
        CONTAINER_HEIGHT
      );

      // Рисуем счетчик
      ctx.fillStyle = count >= rpsLimit ? 'red' : '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${count} / ${rpsLimit}`,
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
        containerTop + CONTAINER_HEIGHT + 30
      );

      // Обновляем и рисуем запросы
      setRequests(prev =>
        prev
          .map(req => {
            // Физика движения
            let { x, y, velocity, accepted } = req;

            // Преобразуем относительные координаты в абсолютные
            const absX = CONTAINER_PADDING + x * containerWidth;

            // Целевая позиция Y для принятых запросов - распределяем внутри контейнера
            // Вычисляем позицию на основе индекса запроса, а не общего счетчика
            // Это гарантирует, что каждый запрос будет размещен на своей позиции
            const acceptedRequests = prev.filter(r => r.accepted).length;
            const rowCapacity = Math.floor(containerWidth / (BALL_RADIUS * 3));
            const index = acceptedRequests % (rowCapacity * 4); // Ограничиваем 4 рядами для видимости

            const row = Math.floor(index / rowCapacity);
            const col = index % rowCapacity;

            const acceptedTargetY = containerTop + BALL_RADIUS * 2 + row * BALL_RADIUS * 3;
            const acceptedTargetX = CONTAINER_PADDING + BALL_RADIUS * 2 + col * BALL_RADIUS * 3;

            // Если запрос принят и достиг целевой позиции по Y, фиксируем его
            if (accepted && y >= acceptedTargetY) {
              // Для принятых запросов изменяем также X-координату, чтобы выстроить их в ряды
              const newX = (acceptedTargetX - CONTAINER_PADDING) / containerWidth;
              return {
                ...req,
                y: acceptedTargetY,
                x: newX,
                velocity: 0
              };
            }

            // Если запрос отклонен и достиг верха контейнера, отскакиваем
            if (!accepted && y >= containerTop - BALL_RADIUS) {
              // Если скорость слишком мала для отскока, удаляем запрос
              if (Math.abs(velocity) < 1) {
                return null;
              }

              return {
                ...req,
                y: containerTop - BALL_RADIUS,
                velocity: -velocity * 0.7 // Отскок с потерей энергии
              };
            }

            // Применяем гравитацию
            velocity += gravity;
            y += velocity;

            return { ...req, y, velocity };
          })
          .filter(Boolean) // Удаляем null значения
          .filter(req => {
            // Удаляем старые запросы (старше 5 секунд) и вылетевшие за пределы экрана
            return now - req.created < 5000 && req.y < canvas.height + BALL_RADIUS;
          })
      );

      // Рисуем запросы
      requests.forEach(req => {
        const absX = CONTAINER_PADDING + req.x * containerWidth;

        ctx.beginPath();
        ctx.arc(absX, req.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = req.accepted ? 'limegreen' : 'tomato';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
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