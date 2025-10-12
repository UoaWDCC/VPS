import { useState, useEffect, useRef } from "react";

const OFFSET = 5;

let listener;

export const render = ({ menu, position }) => {
  if (!listener) return;
  listener({ menu, position });
  attachClickAwayListener();
};

export const unrender = () => {
  if (!listener) return;
  listener({ menu: null, position: null });
};

// wrapper for menu item functions
export function handle(callback, ...params) {
  return function () {
    unrender();
    callback(...params);
  };
}

const attachClickAwayListener = () => {
  const clickAwayListener = (event) => {
    const menu = document.getElementById("context-menu-wrapper");
    if (menu?.contains(event.target)) return;
    unrender();
    document.removeEventListener("mouseup", clickAwayListener);
  };

  document.addEventListener("mouseup", clickAwayListener, { passive: true });
};

export const ContextMenuPortal = () => {
  const [current, setCurrent] = useState({ menu: null, position: null });
  const [adjustedPosition, setAdjustedPosition] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    listener = setCurrent;
    return () => (listener = null);
  }, [setCurrent]);

  useEffect(() => {
    if (!current.menu || !menuRef.current) return;

    const { innerWidth: vw, innerHeight: vh } = window;
    const rect = menuRef.current.getBoundingClientRect();

    let left = current.position.x + OFFSET;
    let top = current.position.y + OFFSET;

    if (current.position.x + OFFSET + rect.width > vw) {
      left = current.position.x - OFFSET - rect.width;
    }
    if (current.position.y + OFFSET + rect.height > vh) {
      top = current.position.y - OFFSET - rect.height;
    }

    setAdjustedPosition({ top, left });
  }, [current]);

  if (!current.menu) return null;

  const top = adjustedPosition?.top ?? current.position.y + OFFSET;
  const left = adjustedPosition?.left ?? current.position.x + OFFSET;

  return (
    <div
      id="context-portal"
      className="fixed inset-0 z-[9999] pointer-events-none"
    >
      {current.menu && (
        <div
          ref={menuRef}
          id="context-menu-wrapper"
          style={{ top, left }}
          className="absolute pointer-events-auto"
        >
          {current.menu}
        </div>
      )}
    </div>
  );
};
