import { useEffect, useRef } from "react";

export function usePolling(
  fn: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const tick = async () => {
      if (!active) return;
      await fnRef.current();
    };

    tick();

    const id = setInterval(() => {
      if (active) tick();
    }, intervalMs);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs, enabled]);
}
