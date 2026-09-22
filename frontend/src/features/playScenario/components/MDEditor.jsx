import React, { useEffect, useState } from "react";
import MarkdownEditor from "@uiw/react-markdown-editor";
import "@uiw/react-markdown-editor/markdown-editor.css";

function useColorMode() {
  const [mode, setMode] = useState("dark");

  useEffect(() => {
    const html = document.documentElement;
    const sync = () =>
      setMode(
        html.getAttribute("data-theme") === "vps-light" ? "light" : "dark"
      );

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return mode;
}

export function MDEditor({ value, onChange, height = "400px" }) {
  const colorMode = useColorMode();

  return (
    <div
      data-color-mode={colorMode}
      className="h-full min-h-0 overflow-hidden rounded-xl"
    >
      <MarkdownEditor
        value={value ?? ""}
        height={height}
        visible
        onChange={(markdown) => onChange?.(markdown)}
      />
    </div>
  );
}
