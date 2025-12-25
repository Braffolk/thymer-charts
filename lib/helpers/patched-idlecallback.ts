// Patched idleCallback
const ric =
  (window as any).requestIdleCallback as
    | ((cb: (deadline: { timeRemaining(): number; didTimeout: boolean }) => void, opts?: { timeout?: number }) => number)
    | undefined;

const cic =
  (window as any).cancelIdleCallback as ((id: number) => void) | undefined;

export function patchedIdleCallback(fn: () => void, timeout = 200) {
  if (ric) {
    const id = ric(() => fn(), { timeout });
    return () => cic?.(id);
  }
  const id = window.setTimeout(fn, 0);
  return () => clearTimeout(id);
}