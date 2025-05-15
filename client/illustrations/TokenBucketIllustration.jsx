import { useEffect, useRef, useState } from 'preact/hooks';

export function TokenBucketIllustration({ rpsLimit, rps, running }) {
  const canvasRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const [tokens, setTokens] = useState(rpsLimit);
  const [refillTokens, setRefillTokens] = useState([]);
  const animationFrameRef = useRef(null);
  const lastRefillTimeRef = useRef(Date.now());
  
  // Константы для анимации
  const BALL_RADIUS = 10;
  const TOKEN_RADIUS = 8;
  const BUCKET_WIDTH = 120;
  const BUCKET_HEIGHT = 180;
  const CONTAINER_PADDING = 20;
  
  // Добавление нового запроса и пополнение токенов
  useEffect(() => {
    if (!running) return;
    
    // Пополнение токенов
    const refillInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - lastRefillTimeRef.current) / 1000;
      
      // Пополняем токены с заданной скоростью
      if (tokens < rpsLimit) {
        setTokens(prev => Math.min(rpsLimit, prev + 1));
        
        // Добавляем анимацию падающего токена
        setRefillTokens(prev => [
          ...prev,
          {
            id: now,
            x: Math.random() * 0.8 + 0.1, // Позиция по X (от 0.1 до 0.9)
            y: -TOKEN_RADIUS, // Начальная позиция по Y (над ведром)
            velocity: 0, // Начальная скорость
            created: now
          }
        ]);
      }
      
      lastRefillTimeRef.current = now;
    }, 1000 / rpsLimit); // Пополняем со скоростью лимита
    
    // Добавление запросов
    const requestInterval = setInterval(() => {
      const now = Date.now();
      
      // Определяем, будет ли запрос принят
      const accepted = tokens > 0;
      
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
      
      // Уменьшаем количество токенов при принятии запроса
      if (accepted) {
        setTokens(prev => Math.max(0, prev - 1));
      }
    }, 10000 / rps);
    
    return () => {
      clearInterval(refillInterval);
      clearInterval(requestInterval);
    };
  }, [running, rps, rpsLimit, tokens]);
  
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
      
      // Рисуем ведро (контейнер)
      const bucketX = (canvas.width - BUCKET_WIDTH) / 2;
      const bucketY = canvas.height - BUCKET_HEIGHT - CONTAINER_PADDING;
      
      // Рисуем контур ведра
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bucketX, bucketY);
      ctx.lineTo(bucketX, bucketY + BUCKET_HEIGHT);
      ctx.lineTo(bucketX + BUCKET_WIDTH, bucketY + BUCKET_HEIGHT);
      ctx.lineTo(bucketX + BUCKET_WIDTH, bucketY);
      ctx.stroke();
      
      // Рисуем дно ведра
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(bucketX, bucketY + BUCKET_HEIGHT - 10, BUCKET_WIDTH, 10);
      
      // Рисуем токены в ведре
      const tokensPerRow = Math.floor(BUCKET_WIDTH / (TOKEN_RADIUS * 2.5));
      const maxRows = Math.floor(BUCKET_HEIGHT / (TOKEN_RADIUS * 2.5));
      const maxVisibleTokens = tokensPerRow * maxRows;
      
      for (let i = 0; i < Math.min(tokens, maxVisibleTokens); i++) {
        const row = Math.floor(i / tokensPerRow);
        const col = i % tokensPerRow;
        
        const tokenX = bucketX + TOKEN_RADIUS * 2 + col * (TOKEN_RADIUS * 2.5);
        const tokenY = bucketY + BUCKET_HEIGHT - TOKEN_RADIUS * 2 - row * (TOKEN_RADIUS * 2.5);
        
        ctx.beginPath();
        ctx.arc(tokenX, tokenY, TOKEN_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'limegreen';
        ctx.fill();
        ctx.closePath();
      }
      
      // Рисуем счетчик токенов
      ctx.fillStyle = tokens === 0 ? 'red' : '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${tokens} / ${rpsLimit} токенов`,
        canvas.width / 2,
        bucketY + BUCKET_HEIGHT + 30
      );
      
      // Рисуем скорость пополнения
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.fillText(
        `Пополнение: ${rpsLimit} токенов/сек`,
        canvas.width / 2,
        bucketY + BUCKET_HEIGHT + 50
      );
      
      // Обновляем и рисуем падающие токены (пополнение)
      setRefillTokens(prev => 
        prev
          .map(token => {
            // Физика движения
            let { x, y, velocity } = token;
            
            // Преобразуем относительные координаты в абсолютные
            const absX = bucketX + x * BUCKET_WIDTH;
            
            // Если токен достиг верха ведра, останавливаем его
            const bucketTopY = bucketY;
            
            if (y >= bucketTopY) {
              return null; // Удаляем токен, который достиг ведра
            }
            
            // Применяем гравитацию
            velocity += gravity;
            y += velocity;
            
            return { ...token, y, velocity };
          })
          .filter(Boolean) // Удаляем null (токены, достигшие ведра)
      );
      
      // Рисуем падающие токены
      refillTokens.forEach(token => {
        const absX = bucketX + token.x * BUCKET_WIDTH;
        
        ctx.beginPath();
        ctx.arc(absX, token.y, TOKEN_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'limegreen';
        ctx.fill();
        ctx.closePath();
      });
      
      // Обновляем и рисуем запросы
      setRequests(prev => 
        prev
          .map(req => {
            // Физика движения
            let { x, y, velocity, accepted } = req;
            
            // Преобразуем относительные координаты в абсолютные
            const absX = bucketX + x * BUCKET_WIDTH;
            
            // Если запрос принят и достиг верха ведра, останавливаем его
            const bucketTopY = bucketY - BALL_RADIUS;
            
            if (accepted && y >= bucketTopY) {
              return null; // Удаляем запрос, который был принят и достиг ведра
            }
            
            // Если запрос отклонен и достиг верха ведра, отскакиваем
            if (!accepted && y >= bucketTopY) {
              return { 
                ...req, 
                y: bucketTopY, 
                velocity: -velocity * 0.6 // Отскок с потерей энергии
              };
            }
            
            // Применяем гравитацию
            velocity += gravity;
            y += velocity;
            
            return { ...req, y, velocity };
          })
          .filter(Boolean) // Удаляем null (принятые запросы, достигшие ведра)
          .filter(req => {
            // Удаляем старые запросы (старше 3 секунд)
            return now - req.created < 3000;
          })
      );
      
      // Рисуем запросы
      requests.forEach(req => {
        const absX = bucketX + req.x * BUCKET_WIDTH;
        
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
  }, [requests, refillTokens, tokens, rpsLimit]);
  
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
  
  // Сбрасываем состояние при изменении лимита
  useEffect(() => {
    setTokens(rpsLimit);
  }, [rpsLimit]);
  
  return (
    <div className="illustration">
      <h3 className="illustration__title">🎟️ Token Bucket</h3>
      <div className="illustration__canvas-container">
        <canvas ref={canvasRef} className="illustration__canvas" />
      </div>
      <p className="illustration__description">
        Контейнер с токенами, которые пополняются с заданной скоростью. 
        Каждый запрос потребляет один токен. Если токенов нет, запрос отклоняется.
      </p>
    </div>
  );
}
