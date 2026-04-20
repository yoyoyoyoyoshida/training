import { useEffect } from 'react';

export function useAsyncEffect(effect: () => Promise<void | (() => void)>, deps: unknown[]) {
  useEffect(() => {
    let cleanup: void | (() => void);
    let isMounted = true;

    const run = async () => {
      cleanup = await effect();
    };

    run();

    return () => {
      isMounted = false;
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
