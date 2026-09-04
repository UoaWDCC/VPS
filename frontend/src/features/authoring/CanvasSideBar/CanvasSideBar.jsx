import { useLayoutEffect, useRef, useState } from "react";
import {
  BoxIcon,
  BracesIcon,
  HeadphonesIcon,
  MonitorCog,
  ZapIcon,
} from "lucide-react";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";
import AudioManager from "../audio/AudioManager";
import PanelIcon from "./PanelIcon";
import SidePanel from "./SidePanel";
import SceneSettings from "./SceneSettings";
import PropertyBindingMenu from "../../../components/Properties/PropertyBindingMenu";
import { ObjectPropertyEditor } from "./ObjectPropertyEditor";
import PropertyOperationMenu from "../../../components/Properties/PropertyOperationMenu";

const ALWAYS_PANELS = [
  { key: "scene", label: "Scene Details", Icon: MonitorCog },
  { key: "audio", label: "Audio Elements", Icon: HeadphonesIcon },
];

const CONTEXTUAL_PANELS = [
  { key: "bindings", label: "Property Bindings", Icon: BracesIcon },
  { key: "object-properties", label: "Object Properties", Icon: BoxIcon },
  { key: "actions", label: "Button Actions", Icon: ZapIcon },
];

const PANEL_LABELS = Object.fromEntries(
  [...ALWAYS_PANELS, ...CONTEXTUAL_PANELS].map(({ key, label }) => [key, label])
);

const CONTEXTUAL_PANEL_KEYS = new Set(CONTEXTUAL_PANELS.map((p) => p.key));

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

  // fall back to the scene details panel
  useLayoutEffect(() => {
    if (!component && CONTEXTUAL_PANEL_KEYS.has(activePanel)) {
      setActivePanel("scene");
    }
  }, [component, activePanel]);

  // FLIP: when the contextual icons appear/disappear, the icon stack
  // recenters vertically. Compensate by animating from its old position.
  useLayoutEffect(() => {
    const iconStack = iconStackRef.current;
    if (!iconStack) return;

    const hasSelection = Boolean(component);
    const currentTop = iconStack.getBoundingClientRect().top;
    const previousTop = previousStackTopRef.current;
    const presenceChanged =
      previousSelectionPresenceRef.current !== null &&
      previousSelectionPresenceRef.current !== hasSelection;

    previousStackTopRef.current = currentTop;
    previousSelectionPresenceRef.current = hasSelection;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion || !presenceChanged || previousTop === currentTop) return;

    iconStack.animate(
      [
        { transform: `translateY(${previousTop - currentTop}px)` },
        { transform: "translateY(0)" },
      ],
      { duration: 150, easing: "ease-out" }
    );

    if (hasSelection) {
      contextualIconsRef.current?.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 150, easing: "ease-out" }
      );
    }
  }, [selected, component?.clickable, activePanel]);

  return (
    <div
      className={`flex shrink-0 items-center justify-end gap-3 overflow-hidden pb-m transition-[width] duration-150 ease-out motion-reduce:transition-none ${activePanel ? "w-[calc(24rem_+_4.25rem)]" : "w-14"
        }`}
    >
      <SidePanel
        label={PANEL_LABELS[activePanel]}
        open={Boolean(activePanel)}
        onClose={() => setActivePanel(null)}
      >
        {activePanel === "scene" && <SceneSettings />}
        {activePanel === "audio" && <AudioManager />}
        {activePanel === "bindings" && (
          <PropertyBindingMenu component={component} />
        )}
        {activePanel === "object-properties" && (
          <ObjectPropertyEditor component={component} />
        )}
        {activePanel === "actions" && (
          <PropertyOperationMenu component={component} />
        )}
      </SidePanel>
      <div ref={iconStackRef} className="flex shrink-0 flex-col gap-3">
        {ALWAYS_PANELS.map(({ key, label, Icon }) => (
          <PanelIcon
            key={key}
            label={label}
            Icon={Icon}
            active={activePanel === key}
            onClick={() => togglePanel(key)}
          />
        ))}
        {component && (
          <div ref={contextualIconsRef} className="flex flex-col gap-3">
            {CONTEXTUAL_PANELS.map(({ key, label, Icon }) => (
              <PanelIcon
                key={key}
                label={label}
                Icon={Icon}
                active={activePanel === key}
                onClick={() => togglePanel(key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
