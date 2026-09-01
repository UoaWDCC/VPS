import { useEffect, useState } from "react";
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

  return (
    <div className="relative flex pb-m flex-col justify-center w-[24vw] gap-s overflow-y-auto overflow-x-hidden no-scrollbar">
      <SceneSettings
        open={activePanel === "scene"}
        onToggle={() => togglePanel("scene")}
      />
      <AudioManager
        open={activePanel === "audio"}
        onToggle={() => togglePanel("audio")}
      />
      <ComponentSettings
        component={component}
        activePanel={activePanel}
        onTogglePanel={togglePanel}
      />
    </div>
  );
}
