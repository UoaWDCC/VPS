export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  timeout: number
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), timeout);
  };
}
