import {useState, useEffect, useRef} from 'react';

type DebounceOptions = {
  delay?: number;
  leading?: boolean; // emit on first change
  trailing?: boolean; // emit after delay (default)
};

export function useDebounceState<T>(
  initialState: T,
  delayOrOptions: number | DebounceOptions = 300
): [{value: T; debounced: T}, (value: T) => void] {
  const [value, setValue] = useState<T>(initialState);
  const [debounced, setDebounced] = useState<T>(initialState);
  const isFirstChange = useRef(true);

  const {
    delay = 300,
    leading = false,
    trailing = true,
  } = typeof delayOrOptions === 'number'
    ? {delay: delayOrOptions, leading: false, trailing: true}
    : {delay: 300, leading: false, trailing: true, ...delayOrOptions};

  useEffect(() => {
    if (leading && isFirstChange.current) {
      isFirstChange.current = false;
      setDebounced(value);
    }

    if (!trailing) return;

    const timer = setTimeout(() => {
      setDebounced(value);
      isFirstChange.current = true;
    }, delay);

    return (): void => clearTimeout(timer);
  }, [value, delay, leading, trailing]);

  return [{value, debounced}, setValue];
}
