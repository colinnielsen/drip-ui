import { useEffect, useState } from 'react';

export const useSecondsSinceMount = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(c => c + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return seconds;
};
