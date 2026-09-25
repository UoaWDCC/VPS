import { useContext, useState, useEffect, useRef } from "react";
import ScenarioContext from "context/ScenarioContext";
import SceneContext from "context/SceneContext";
import { generateUniqueSceneName } from "../../../utils/sceneUtils";
import { getScene } from "../scene/scene";

import useVisualScene from "../stores/visual";
import { modifySceneProp } from "../scene/operations/modifiers";
import shallow from "zustand/shallow";
import toast from "react-hot-toast";
import PanelSection from "./PanelSection";
import PanelInput from "./PanelInput";
import MultiSelectInput from "../components/MultiSelectInput";
import SceneSelectInput from "../components/SceneSelectInput";
import ActionsInput from "../components/ActionsInput";

/**
 * The content of the "Scene Details" panel.
 * @component
 */
function SceneDetailsPanel() {
  const { scenes, modifyScene } = useContext(SceneContext);
  const { roleList } = useContext(ScenarioContext);

  const name = useVisualScene((scene) => scene.name);
  const roles = useVisualScene((scene) => scene.roles);
  const sceneId = useVisualScene((scene) => scene.id);
  const time = useVisualScene((scene) => scene.time);
  const defaultActionRefs = useVisualScene((scene) => scene.defaultActionRefs);
  const timerActionRefs = useVisualScene((scene) => scene.timerActionRefs);

  const [selectedRoles, setSelectedRoles] = useState(roles ?? []);
  const [sceneName, setSceneName] = useState(name ?? "");
  const [timerDuration, setTimerDuration] = useState(time ?? "");

  const defaultActionsRef = useRef(null);
  const timerActionsRef = useRef(null);

  useEffect(() => {
    if (!name || name === sceneName) return;
    setSceneName(name);
  }, [name]);

  useEffect(() => {
    const stored = time ?? "";
    if (stored == timerDuration) return;
    setTimerDuration(stored);
  }, [time]);

  useEffect(() => {
    if (!roleList || !roles) return;
    const selected = roleList.filter((role) => roles.includes(role));
    if (!shallow(selected, selectedRoles)) setSelectedRoles(selected);
  }, [roleList, roles]);

  function saveTimerDuration() {
    const parsed = parseInt(timerDuration, 10);
    modifySceneProp("time", !isNaN(parsed) && parsed > 0 ? parsed : null);
  }

  async function saveSceneName() {
    const name = sceneName.trim();

    if (!name?.length) {
      alert("Scene name cannot be empty.");
      return;
    }

    const { id: sceneId } = useVisualScene.getState();
    const safeName = generateUniqueSceneName(scenes, name, sceneId);

    // handle dupes, update local state, and save to db
    if (safeName !== name) {
      console.log("duplicate found, generating unique name...");
      toast.error(`"${name}" already exists, renamed to "${safeName}".`);
    }

    modifySceneProp("name", safeName);
    setSceneName(safeName);

    try {
      modifyScene(getScene());
    } catch (error) {
      console.error(error);
      toast.error("Could not save the scene name.");
    }
  }

  function changeSceneName(e) {
    setSceneName(e.target.value);
  }

  function changeRole(role, value) {
    const next = value
      ? [...selectedRoles, role]
      : selectedRoles.filter((r) => r !== role);
    setSelectedRoles(next);
    modifySceneProp("roles", next);
  }

  function saveDefaultActionRefs(updated) {
    modifySceneProp("defaultActionRefs", updated);
  }

  function deleteDefaultActionRef(id) {
    saveDefaultActionRefs(defaultActionRefs.filter((ref) => ref.id !== id));
  }

  function saveTimerActionRefs(updated) {
    modifySceneProp("timerActionRefs", updated);
  }

  function deleteTimerActionRef(id) {
    saveTimerActionRefs(timerActionRefs.filter((ref) => ref.id !== id));
  }

  return (
    <>
      <PanelSection name="Details" id="scene-details">
        <PanelInput label="Name">
          <input
            type="text"
            value={sceneName}
            onChange={changeSceneName}
            onBlur={saveSceneName}
            className="input"
            placeholder="Awesome Scene"
          />
        </PanelInput>
        <PanelInput label="Allowed Roles">
          <MultiSelectInput
            values={roleList}
            selected={selectedRoles}
            onChange={changeRole}
          />
        </PanelInput>
      </PanelSection>
      <PanelSection name="Scene Link" id="scene-link">
        <PanelInput label="Default Linked Scene">
          <SceneSelectInput
            scenes={scenes}
            value={null}
            exclusionId={sceneId}
            onChange={console.log}
          />
        </PanelInput>
        <PanelInput
          label="Actions"
          onAdd={() => defaultActionsRef.current?.addItem()}
        >
          <ActionsInput
            ref={defaultActionsRef}
            items={defaultActionRefs}
            onDelete={deleteDefaultActionRef}
            onReorder={saveDefaultActionRefs}
          />
        </PanelInput>
      </PanelSection>
      <PanelSection name="Timer" id="scene-timer">
        <PanelInput label="Timer Duration (Seconds)">
          <input
            type="number"
            min="1"
            value={timerDuration}
            onChange={(e) => setTimerDuration(e.target.value)}
            onBlur={saveTimerDuration}
            className="input"
            placeholder="No timer"
          />
        </PanelInput>
        <PanelInput label="Timeout Default Linked Scene">
          <SceneSelectInput
            scenes={scenes}
            value={null}
            exclusionId={sceneId}
            onChange={console.log}
          />
        </PanelInput>
        <PanelInput
          label="Timeout Actions"
          onAdd={() => timerActionsRef.current?.addItem()}
        >
          <ActionsInput
            ref={timerActionsRef}
            items={timerActionRefs}
            onDelete={deleteTimerActionRef}
            onReorder={saveTimerActionRefs}
          />
        </PanelInput>
      </PanelSection>
    </>
  );
}

export default SceneDetailsPanel;
