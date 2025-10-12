import { getComponent } from "../scene/scene";
import useEditorStore from "../stores/editor";
import AudioManager from "./AudioManager";
import ComponentProperties from "./ComponentProperties";
import SceneSettings from "./SceneSettings";

/**
 * This component displays the properties of scene components in a sidebar
 * @component
 */
export default function CanvasSideBar() {
  const selected = useEditorStore((state) => state.selected);

  const component = selected ? getComponent(selected) : null;

  return (
    <div className="flex pb-m flex-col w-[18vw] gap-s overflow-y-auto no-scrollbar">
      <SceneSettings />
      <AudioManager />
      <ComponentProperties component={component} />
    </div>
  );
}
