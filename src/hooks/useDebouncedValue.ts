import { useEffect, useState } from "react";

/**
 * Delays a changing value so a server-side search does not fire on every
 * keystroke. The current value is returned immediately on first render, so the
 * first load is never delayed.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (value === debounced) return;
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  return debounced;
}
