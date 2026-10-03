import { useContext, useRef } from "react";
import ScenarioContext from "context/ScenarioContext";
import SceneContext from "context/SceneContext";
import { generateUniqueSceneName } from "../../../utils/sceneUtils";

import useVisualScene from "../stores/visual";
import PanelSection from "./PanelSection";
import MultiSelectInput from "../components/MultiSelectInput";
import SceneSelectInput from "../components/SceneSelectInput";
import ActionsInput from "../components/ActionsInput";
import useField from "../inputs/useField";
import { coerceInt, coerceRange, INVALID, pipe } from "../inputs/coerce";
import { cn } from "../../../util/classnames";
import PanelInput from "./PanelInput";

/**
 * The content of the "Scene Details" panel.
 * @component
 */
function SceneDetailsPanel() {
  const { scenes } = useContext(SceneContext);
  const { roleList } = useContext(ScenarioContext);
  const sceneId = useVisualScene((scene) => scene.id);

  function coerceName(raw) {
    const name = raw.trim();
    if (!name?.length) return INVALID;

    const { id: sceneId } = useVisualScene.getState();
    const safeName = generateUniqueSceneName(scenes, name, sceneId);
    if (safeName !== name) return INVALID; // name already exists

    return name;
  }

  const nameField = useField("name", { coerce: coerceName });
  const rolesField = useField("roles", { empty: null });
  const timeField = useField("time", {
    derive: (v) => (v === null ? "" : String(v)),
    coerce: pipe(coerceInt, coerceRange(0, null)),
  });
  const timerActionRefsField = useField("timerActionRefs", {
    commit: "onChange",
  });
  const defaultActionRefsField = useField("defaultActionRefs", {
    commit: "onChange",
  });
  const defaultLinkedSceneField = useField("defaultLinkedScene", {
    empty: null,
    commit: "onChange",
  });
  const timerLinkedSceneField = useField("timerLinkedScene", {
    empty: null,
    commit: "onChange",
  });

  const defaultActionsRef = useRef(null);
  const timerActionsRef = useRef(null);

  return (
    <>
      <PanelSection name="Details" id="scene-details">
        <PanelInput label="Name">
          <input
            {...nameField.props}
            type="text"
            className={cn("input", nameField.error && "input-error")}
            placeholder="Awesome Scene"
          />
        </PanelInput>
        <PanelInput label="Allowed Roles">
          <MultiSelectInput {...rolesField.props} options={roleList} />
        </PanelInput>
      </PanelSection>
      <PanelSection name="Scene Link" id="scene-link">
        <PanelInput label="Default Linked Scene">
          <SceneSelectInput
            {...defaultLinkedSceneField.props}
            scenes={scenes}
            exclusionId={sceneId}
          />
        </PanelInput>
        <PanelInput
          label="Actions"
          onAdd={() => defaultActionsRef.current?.addItem()}
        >
          <ActionsInput
            {...defaultActionRefsField.props}
            ref={defaultActionsRef}
          />
        </PanelInput>
      </PanelSection>
      <PanelSection name="Timer" id="scene-timer">
        <PanelInput label="Timer Duration (Seconds)">
          <input
            {...timeField.props}
            min="1"
            className={cn("input", timeField.error && "input-error")}
            placeholder="No timer"
          />
        </PanelInput>
        <PanelInput label="Timeout Default Linked Scene">
          <SceneSelectInput
            {...timerLinkedSceneField.props}
            scenes={scenes}
            exclusionId={sceneId}
          />
        </PanelInput>
        <PanelInput
          label="Timeout Actions"
          onAdd={() => timerActionsRef.current?.addItem()}
        >
          <ActionsInput {...timerActionRefsField.props} ref={timerActionsRef} />
        </PanelInput>
      </PanelSection>
    </>
  );
}

export default SceneDetailsPanel;
