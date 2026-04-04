import { useState, useEffect } from 'react';

function getNextUpdateUTC() {
  const now = new Date();
  let next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 5, 0, 0));
  if (now >= next) {
    next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 5, 0, 0));
  }
  return next;
}

function formatCountdown(ms) {
  if (ms <= 0) return '0 год 0 хв 0 с';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (3600000)) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours} год ${minutes} хв ${seconds} с`;
}

export default function StatusPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now);
      const nextUpdate = getNextUpdateUTC();
      const diff = nextUpdate - now;
      setCountdown(formatCountdown(diff));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDateTime = currentTime.toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Kyiv'
  });

  return (
    <div className="status-panel-horizontal">
      <div className="status-item">⚪ Станом на: {formattedDateTime}</div>
      <div className="status-item">⏳ Оновлення даних через {countdown}</div>
      <div className="status-item">📅 щодня о 05:00 UTC</div>
    </div>
  );
}