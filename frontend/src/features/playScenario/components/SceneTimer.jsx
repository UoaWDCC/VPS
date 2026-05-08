import { useEffect, useRef, useState } from "react";

export default function SceneTimer({ duration, onTimeout }) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      onTimeoutRef.current();
    }
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isLow = secondsLeft > 0 && secondsLeft <= Math.min(10, Math.floor(duration * 0.2));

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-semibold shadow-md transition-colors ${
        secondsLeft === 0
          ? "bg-error text-error-content"
          : isLow
          ? "bg-error text-error-content animate-pulse"
          : "bg-neutral text-neutral-content"
      }`}
      role="timer"
      aria-live="off"
      aria-label={`Time remaining: ${display}`}
    >
      <span>⏱</span>
      <span>{display}</span>
    </div>
  );
}
