import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";
import AudioManager from "../audio/AudioManager";
import ComponentSettings from "./ComponentSettings";
import SceneSettings from "./SceneSettings";
import { ObjectPropertyEditor } from "./ObjectPropertyEditor";

/**
 * This component displays the properties of scene components in a sidebar
 * @component
 */
export default function CanvasSideBar() {
  const selected = useEditorStore((state) => state.selected);
  const component = useVisualScene((state) =>
    selected ? state.components[selected] : null
  );
  return (
    <div className="flex pb-m flex-col w-[18vw] gap-s overflow-y-auto overflow-x-hidden no-scrollbar">
      <SceneSettings />
      <AudioManager />
      <ComponentSettings component={component} />
      { component && <ObjectPropertyEditor component={component}></ObjectPropertyEditor>}
    </div>
  );
}
