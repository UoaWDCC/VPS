import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";
import AudioManager from "../audio/AudioManager";
import ComponentSettings from "./ComponentSettings";
import SceneSettings from "./SceneSettings";

/**
 * This component displays the properties of scene components in a sidebar
 * @component
 */
export default function CanvasSideBar() {
  const [activePanel, setActivePanel] = useState(null);
  const iconStackRef = useRef(null);
  const contextualIconsRef = useRef(null);
  const previousStackTopRef = useRef(null);
  const previousSelectionPresenceRef = useRef(null);
  const selected = useEditorStore((state) => state.selected);
  const component = useVisualScene((state) =>
    selected ? state.components[selected] : null
  );

  function togglePanel(panel) {
    setActivePanel((current) => (current === panel ? null : panel));
  }

  useEffect(() => {
    setActivePanel(null);
  }, [selected]);

  //side panel animation
  useLayoutEffect(() => {
    const iconStack = iconStackRef.current;
    if (!iconStack) return;

    const currentTop = iconStack.getBoundingClientRect().top;
    const previousTop = previousStackTopRef.current;
    const contextualIcons = contextualIconsRef.current;
    const hasSelection = Boolean(component);
    const selectionPresenceChanged =
      previousSelectionPresenceRef.current !== null &&
      previousSelectionPresenceRef.current !== hasSelection;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
      !reduceMotion &&
      selectionPresenceChanged &&
      previousTop !== null &&
      previousTop !== currentTop &&
      typeof iconStack.animate === "function"
    ) {
      iconStack.animate(
        [
          { transform: `translateY(${previousTop - currentTop}px)` },
          { transform: "translateY(0)" },
        ],
        { duration: 250, easing: "ease-out" }
      );
    }

    if (
      !reduceMotion &&
      selectionPresenceChanged &&
      hasSelection &&
      contextualIcons &&
      typeof contextualIcons.animate === "function"
    ) {
      contextualIcons.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 250, easing: "ease-out" }
      );
    }

    previousStackTopRef.current = currentTop;
    previousSelectionPresenceRef.current = hasSelection;
  }, [selected, component?.clickable]);

  return (
    <div className="relative flex pb-m flex-col justify-center w-[24vw] overflow-y-auto overflow-x-hidden no-scrollbar">
      <div ref={iconStackRef} className="flex flex-col gap-s">
        <SceneSettings
          open={activePanel === "scene"}
          onToggle={() => togglePanel("scene")}
        />
        <AudioManager
          open={activePanel === "audio"}
          onToggle={() => togglePanel("audio")}
        />
        {component && (
          <div ref={contextualIconsRef} className="flex flex-col gap-s">
            <ComponentSettings
              component={component}
              activePanel={activePanel}
              onTogglePanel={togglePanel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
