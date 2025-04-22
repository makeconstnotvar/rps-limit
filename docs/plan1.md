# План реализации интерактивных визуализаций для алгоритмов

## 1. Архитектурные решения

### 1.1. Компонентная структура
- Расширить существующий компонент `VisualBucket` для поддержки более сложных визуализаций
- Создать вспомогательные компоненты для общих элементов визуализации (счетчики, потоки, таймеры)
- Использовать единый интерфейс, но разные реализации для каждого алгоритма

### 1.2. Хранение и передача состояния
- Добавить в App.jsx трекинг внутреннего состояния алгоритмов
- Расширить логику имитации алгоритмов через соответствующие классы и структуры данных
- Передавать состояние в компонент визуализации через пропсы

## 2. Визуализации для каждого алгоритма

### 2.1. Fixed Window
- Создать анимированный прямоугольник, представляющий временное окно
- Отображать внутри счетчик запросов с цветовой индикацией превышения лимита
- Реализовать плавный переход при смене окна с анимацией сброса счетчика
- Добавить таймер обратного отсчета до сброса окна

### 2.2. Sliding Log
- Реализовать горизонтальную шкалу времени с маркерами запросов
- Анимировать плавное движение маркеров влево по мере их "старения"
- Визуализировать добавление новых маркеров при каждом запросе
- Показать границу лимита и применить цветовую индикацию превышения

### 2.3. Sliding Counter
- Создать набор вертикальных столбцов, представляющих временные сегменты (бакеты)
- Визуализировать счетчик в каждом столбце с высотой, пропорциональной количеству запросов
- Анимировать перемещение столбцов по временной шкале
- Отображать суммарное количество запросов с индикацией превышения лимита

### 2.4. Token Bucket
- Визуализировать контейнер с анимированными токенами внутри
- Реализовать "дождь" токенов сверху при пополнении
- Анимировать извлечение токена при каждом запросе
- Показывать индикатор скорости пополнения и счетчик доступных токенов

### 2.5. Leaky Bucket
- Создать визуализацию контейнера с "жидкостью", представляющей очередь запросов
- Анимировать падение капель сверху при входящих запросах
- Реализовать постоянное "вытекание" с фиксированной скоростью снизу
- Визуализировать переполнение при достижении максимального размера очереди

## 3. Техническая реализация

### 3.1. Состояние алгоритмов
```jsx
// Модель для хранения состояния алгоритмов в App.jsx
const [algorithmStates, setAlgorithmStates] = useState({
  fixedWindow: {
    windowStart: Date.now(),
    windowSize: 1000,
    count: 0,
    limit: rpsLimit
  },
  slidingLog: {
    timestamps: [],
    windowSize: 1000,
    limit: rpsLimit
  },
  slidingCounter: {
    buckets: [],
    bucketSize: 100,
    windowSize: 1000,
    limit: rpsLimit
  },
  tokenBucket: {
    tokens: rpsLimit,
    maxTokens: rpsLimit,
    refillRate: rpsLimit,
    lastRefill: Date.now()
  },
  leakyBucket: {
    queue: [],
    maxSize: rpsLimit,
    processRate: rpsLimit,
    lastProcess: Date.now()
  }
});
```

### 3.2. Обновление состояния
```jsx
// Функция для обновления состояния алгоритмов
const updateAlgorithmState = useCallback((success) => {
  const now = Date.now();
  
  setAlgorithmStates(prev => {
    const newState = {...prev};
    
    // Fixed Window
    const fw = newState.fixedWindow;
    if (now - fw.windowStart > fw.windowSize) {
      fw.windowStart = now;
      fw.count = success ? 1 : 0;
    } else if (success) {
      fw.count++;
    }
    
    // Sliding Log
    const sl = newState.slidingLog;
    // Удаляем устаревшие метки
    sl.timestamps = sl.timestamps.filter(t => now - t <= sl.windowSize);
    if (success) {
      sl.timestamps.push(now);
    }
    
    // Sliding Counter
    const sc = newState.slidingCounter;
    const currentBucket = Math.floor(now / sc.bucketSize);
    // Очищаем старые бакеты
    sc.buckets = sc.buckets.filter(b => 
      (currentBucket - b.id) * sc.bucketSize <= sc.windowSize
    );
    // Увеличиваем счетчик текущего бакета
    const bucketIndex = sc.buckets.findIndex(b => b.id === currentBucket);
    if (bucketIndex >= 0 && success) {
      sc.buckets[bucketIndex].count++;
    } else if (success) {
      sc.buckets.push({ id: currentBucket, count: 1 });
    } else if (bucketIndex < 0) {
      sc.buckets.push({ id: currentBucket, count: 0 });
    }
    
    // Token Bucket
    const tb = newState.tokenBucket;
    // Пополнение токенов
    const elapsedSec = (now - tb.lastRefill) / 1000;
    const refill = Math.floor(elapsedSec * tb.refillRate);
    if (refill > 0) {
      tb.tokens = Math.min(tb.maxTokens, tb.tokens + refill);
      tb.lastRefill = now;
    }
    // Расход токена при успешном запросе
    if (success) {
      tb.tokens = Math.max(0, tb.tokens - 1);
    }
    
    // Leaky Bucket
    const lb = newState.leakyBucket;
    // Обработка очереди
    const leakElapsedSec = (now - lb.lastProcess) / 1000;
    const leaks = Math.floor(leakElapsedSec * lb.processRate);
    if (leaks > 0) {
      lb.queue.splice(0, Math.min(leaks, lb.queue.length));
      lb.lastProcess = now;
    }
    // Добавление в очередь при успешном запросе
    if (success) {
      lb.queue.push(now);
    }
    
    return newState;
  });
}, []);
```

### 3.3. Интеграция с запросами
```jsx
// Модификация функции запроса в App.jsx
const makeRequest = async () => {
  try {
    await axios.get(`http://localhost:3000/api/test`);
    setStats(prev => ({...prev, allowed: prev.allowed + 1}));
    updateAlgorithmState(true); // Запрос успешен
  } catch (error) {
    if (error.response?.status === 429) {
      setStats(prev => ({...prev, denied: prev.denied + 1}));
      updateAlgorithmState(false); // Запрос отклонен
    }
  }
};
```

### 3.4. Компонент AlgorithmVisualizer
```jsx
// Расширение существующего компонента VisualBucket.jsx
export function VisualBucket({ algorithm, state, rpsLimit }) {
  // Общий враппер для всех визуализаций
  const VisualizerWrapper = ({ title, children }) => (
    <div className="visual-bucket">
      <h3 className="visual-bucket__title">{title}</h3>
      {children}
    </div>
  );

  // Расширенная визуализация Fixed Window
  if (algorithm === 'fixedWindow') {
    const { windowStart, count, windowSize } = state.fixedWindow;
    const now = Date.now();
    const elapsed = now - windowStart;
    const timeLeft = Math.max(0, windowSize - elapsed);
    const progress = (elapsed / windowSize) * 100;
    const isOverLimit = count > rpsLimit;

    return (
      <VisualizerWrapper title="🪟 Fixed Window">
        <div className="visual-bucket__fixed-window">
          <div className="visual-bucket__window-container">
            <div 
              className="visual-bucket__progress-bar"
              style={{ width: `${progress}%` }}
            />
            <div className={`visual-bucket__counter ${isOverLimit ? 'visual-bucket__counter--over' : ''}`}>
              {count} / {rpsLimit}
            </div>
          </div>
          <p className="visual-bucket__timer">Сброс через: {Math.ceil(timeLeft / 1000)}с</p>
        </div>
      </VisualizerWrapper>
    );
  }

  if (algorithm === 'slidingLog') {
    // Расширенная версия существующей визуализации
    const { timestamps, windowSize } = state.slidingLog;
    const now = Date.now();
    
    return (
      <VisualizerWrapper title="📜 Sliding Log">
        <div className="visual-bucket__sliding-log">
          <div className="visual-bucket__log-container">
            {timestamps.map((ts, i) => {
              const age = now - ts;
              const percent = 100 - (age / windowSize) * 100;
              return (
                <div
                  key={i}
                  className="visual-bucket__log-mark"
                  style={{ left: `${percent}%` }}
                />
              );
            })}
            <div className="visual-bucket__limit-line" style={{ width: `${rpsLimit * 10}px` }} />
          </div>
          <p className="visual-bucket__status">
            {timestamps.length} / {rpsLimit} запросов в окне
          </p>
        </div>
      </VisualizerWrapper>
    );
  }

  // Аналогично расширить остальные визуализации...
  
  // Если алгоритм не поддерживается
  return <div>Визуализация недоступна</div>;
}
```

### 3.5. Стили для визуализаций
```scss
// Добавить в _visual-bucket.scss

// Fixed Window
.visual-bucket {
  &__fixed-window {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  &__window-container {
    width: 100%;
    height: 50px;
    border: 2px solid #333;
    position: relative;
    overflow: hidden;
    margin-bottom: 10px;
  }

  &__progress-bar {
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    position: absolute;
    top: 0;
    left: 0;
    transition: width 0.2s linear;
  }

  &__counter {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    z-index: 2;
    
    &--over {
      color: red;
    }
  }

  &__timer {
    font-size: 14px;
    color: #666;
  }

  // Расширенные стили для Sliding Log
  &__log-container {
    position: relative;
    height: 60px;
    border: 1px solid #aaa;
    background: #f9f9f9;
    margin-bottom: 10px;
    overflow: hidden;
  }

  &__limit-line {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    border-left: 2px dashed red;
    z-index: 1;
  }

  // Стили для других визуализаций...
}
```

## 4. Модификация существующего кода

### 4.1. Интеграция в App.jsx
```jsx
// В App.jsx добавить:
return (
  <div className="container py-4">
    {/* ... Существующий код ... */}
    
    <div className="row mb-4">
      <div className="col-12">
        <div className="card p-3">
          <h3 className="h5 mb-3">🎮 Визуализация алгоритма</h3>
          <VisualBucket 
            algorithm={algorithm} 
            state={algorithmStates} 
            rpsLimit={rpsLimit} 
          />
        </div>
      </div>
    </div>
    
    {/* ... Остальной код ... */}
  </div>
);
```

### 4.2. Обновление зависимостей обновления состояния
```jsx
// Добавить эффект для периодического обновления состояния 
// независимо от запросов (для анимаций)
useEffect(() => {
  if (running) {
    const animationTimer = setInterval(() => {
      setAlgorithmStates(prev => {
        // Обновляем состояние для анимаций
        // Можно использовать ту же логику из updateAlgorithmState
        // но без добавления новых запросов
        return {...prev};
      });
    }, 100); // 10 FPS для плавности анимации
    
    return () => clearInterval(animationTimer);
  }
}, [running]);
```

## 5. Специфичные детали для каждого алгоритма

### 5.1. Token Bucket - анимация падающих токенов
```jsx
// Компонент TokenRain для визуализации пополнения токенов
function TokenRain({ tokens, maxTokens, refillRate }) {
  const [raindrops, setRaindrops] = useState([]);
  
  // Добавление новых капель при пополнении токенов
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokens < maxTokens) {
        setRaindrops(prev => [
          ...prev, 
          { id: Date.now(), x: Math.random() * 100 }
        ]);
      }
    }, 1000 / refillRate);
    
    return () => clearInterval(interval);
  }, [tokens, maxTokens, refillRate]);
  
  // Удаление капель, достигших дна
  useEffect(() => {
    const interval = setInterval(() => {
      setRaindrops(prev => prev.filter(drop => 
        Date.now() - drop.id < 1000
      ));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="token-rain">
      {raindrops.map(drop => (
        <div 
          key={drop.id}
          className="token-rain__drop"
          style={{ left: `${drop.x}%` }}
        />
      ))}
    </div>
  );
}
```

### 5.2. Leaky Bucket - анимация вытекания
```jsx
// Компонент LeakyFlow для визуализации вытекания запросов
function LeakyFlow({ processRate }) {
  const [drops, setDrops] = useState([]);
  
  // Создание новых капель для анимации вытекания
  useEffect(() => {
    const interval = setInterval(() => {
      setDrops(prev => [
        ...prev,
        { id: Date.now(), progress: 0 }
      ]);
    }, 1000 / processRate);
    
    return () => clearInterval(interval);
  }, [processRate]);
  
  // Анимация движения капель и удаление старых
  useEffect(() => {
    const animationFrame = requestAnimationFrame(function animate() {
      setDrops(prev => 
        prev
          .map(drop => ({
            ...drop,
            progress: Math.min(100, drop.progress + 2)
          }))
          .filter(drop => drop.progress < 100)
      );
      
      requestAnimationFrame(animate);
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, []);
  
  return (
    <div className="leaky-flow">
      {drops.map(drop => (
        <div 
          key={drop.id}
          className="leaky-flow__drop"
          style={{ top: `${drop.progress}%` }}
        />
      ))}
    </div>
  );
}
```

## 6. Расширенные взаимодействия

### 6.1. Добавление ручного инжектирования запросов
```jsx
// Кнопка для добавления запроса вручную
function ManualRequestButton({ onRequest, disabled }) {
  return (
    <button 
      className="btn btn-sm btn-primary"
      onClick={onRequest}
      disabled={disabled}
    >
      Добавить запрос
    </button>
  );
}

// Интеграция в визуализацию
<div className="visual-bucket__controls">
  <ManualRequestButton 
    onRequest={() => makeRequest()}
    disabled={!running} 
  />
</div>
```

### 6.2. Информационные подсказки
```jsx
// Компонент подсказки
function InfoTooltip({ title, content }) {
  const [visible, setVisible] = useState(false);
  
  return (
    <div className="info-tooltip">
      <button 
        className="info-tooltip__trigger"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        ℹ️
      </button>
      
      {visible && (
        <div className="info-tooltip__content">
          <h5>{title}</h5>
          <p>{content}</p>
        </div>
      )}
    </div>
  );
}

// Использование в визуализациях
<InfoTooltip
  title="Fixed Window"
  content="Простой подсчет запросов в фиксированном временном окне. При истечении окна счетчик сбрасывается."
/>
```