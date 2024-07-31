import { useEffect, useRef, useState } from 'react';

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

export const usePrevious = <T>(value: T): T | undefined => {
  const [previous, setPrevious] = useState<T | undefined>(undefined);

  useEffect(() => {
    setPrevious(value);
  }, [value]);

  return previous;
};

export function usePolling(callback: () => void, interval: number) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval]);
}
