import { useState, useEffect } from "react";

const OFFSET = 10;

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

  useEffect(() => {
    listener = setCurrent;
    return () => (listener = null);
  }, [setCurrent]);

  return (
    <div
      id="context-portal"
      className="fixed inset-0 z-[9999] pointer-events-none"
    >
      {current.menu && (
        <div
          id="context-menu-wrapper"
          style={{
            top: current.position.y + OFFSET,
            left: current.position.x + OFFSET,
          }}
          className="absolute pointer-events-auto"
        >
          {current.menu}
        </div>
      )}
    </div>
  );
};
