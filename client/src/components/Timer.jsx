import React, { useState, useEffect } from 'react';

const Timer = ({ deadline, onExpire }) => {
  const calculateRemaining = () => {
    if (!deadline) return 0;
    const diff = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
    return diff;
  };

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemaining);

  useEffect(() => {
    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (num) => String(num).padStart(2, '0');

  const formattedTime =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;

  const isLowTime = remainingSeconds <= 300 && remainingSeconds > 0; // Less than 5 minutes

  return (
    <div
      className={`timer-badge ${isLowTime ? 'timer-warning' : ''}`}
      title={isLowTime ? 'Warning: Less than 5 minutes remaining!' : 'Time Remaining'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{formattedTime}</span>
    </div>
  );
};

export default Timer;
