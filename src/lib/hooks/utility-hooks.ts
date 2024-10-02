import { useCallback, useEffect, useRef, useState } from 'react';

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

export const useGeolocationPermissionState = () => {
  const [permissions, setPermissions] = useState<
    (string & PermissionState) | 'init'
  >('init');

  useEffect(() => {
    let permissionStatus: PermissionStatus;

    const handleChange = (p: Event) => {
      console.log(p);
      if (p && p.target && 'state' in p.target)
        return setPermissions(p.target.state as PermissionState);
    };

    navigator.permissions.query({ name: 'geolocation' }).then(v => {
      permissionStatus = v;
      setPermissions(v.state);
      v.addEventListener('change', handleChange);
    });

    return () => {
      permissionStatus?.removeEventListener('change', handleChange);
    };
  }, []);

  return permissions;
};

type LocationState =
  | 'init'
  | 'ready-to-request'
  | 'loading'
  | GeolocationCoordinates
  | 'denied'
  | 'error';

export const useLocationState = () => {
  const permissionState = useGeolocationPermissionState();
  const [locationState, setLocationState] = useState<LocationState>('init');

  const request = useCallback(() => {
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      position => setLocationState(position.coords),
      error => {
        console.warn(error);

        if (error.PERMISSION_DENIED) setLocationState('denied');
        else if (error.POSITION_UNAVAILABLE) setLocationState('error');
        else if (error.TIMEOUT) setLocationState('ready-to-request');
      },
    );
  }, [setLocationState]);

  useEffect(() => {
    if (permissionState === 'granted') request();
    else if (permissionState === 'prompt') setLocationState('ready-to-request');
    else if (permissionState === 'denied') setLocationState('denied');
  }, [request, permissionState]);

  return { locationState, request };
};

export const isLocationReady = (location: LocationState) => {
  return typeof location !== 'string';
};
