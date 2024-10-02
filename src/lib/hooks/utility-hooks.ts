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
  | 'requesting'
  | GeolocationCoordinates
  | 'denied'
  | 'error';

export const useLocationState = () => {
  const [isGeolocationEnabled, setIsGeolocationEnabled] =
    useState<LocationState>('init');

  useEffect(() => {
    if (isGeolocationEnabled === 'init') {
      setIsGeolocationEnabled('requesting');
      navigator.geolocation.getCurrentPosition(
        position => setIsGeolocationEnabled(position.coords),
        error => {
          console.error(error);
          if (error.PERMISSION_DENIED) setIsGeolocationEnabled('denied');
          if (error.POSITION_UNAVAILABLE) setIsGeolocationEnabled('error');
          if (error.TIMEOUT) setIsGeolocationEnabled('error');
        },
      );
    }
  }, [isGeolocationEnabled]);

  return isGeolocationEnabled;
};

export const isLocationReady = (location: LocationState) => {
  return typeof location !== 'string';
};
