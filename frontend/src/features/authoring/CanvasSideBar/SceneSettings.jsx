import { useContext, useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import ScenarioContext from "context/ScenarioContext";
import SceneContext from "context/SceneContext";
import { generateUniqueSceneName } from "../../../utils/sceneUtils";
import { getScene } from "../scene/scene";

import useVisualScene from "../stores/visual";
import { modifySceneProp } from "../scene/operations/modifiers";
import useDirectLink from "./useDirectLink";
import shallow from "zustand/shallow";
import toast from "react-hot-toast";
import TimerStateOperationMenu from "../../../components/StateVariables/TimerStateOperationMenu";
import SelectInput from "../components/Select";

/**
 * This component displays the settings of a scene, such as the scene name
 * @component
 */
export default function SceneSettings() {
  const { scenes, modifyScene } = useContext(SceneContext);
  const { roleList } = useContext(ScenarioContext);

  const name = useVisualScene((scene) => scene.name);
  const roles = useVisualScene((scene) => scene.roles);
  const sceneId = useVisualScene((scene) => scene.id);
  const {
    directLink,
    disabled: directLinkDisabled,
    defaultTarget: defaultDirectLinkScene,
  } = useDirectLink();
  const time = useVisualScene((scene) => scene.time);

  const [selectedRoles, setSelectedRoles] = useState(roles ?? []);
  const [sceneName, setSceneName] = useState(name ?? "");
  const [timerDuration, setTimerDuration] = useState(time ?? "");

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

  function saveSceneRoles() {
    modifySceneProp("roles", selectedRoles);
  }

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
    if (value) setSelectedRoles((prev) => [...prev, role]);
    else setSelectedRoles((prev) => prev.filter((r) => r !== role));
  }

  return (
    <>
      <div className="collapse collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title">Scene Details</div>
        <div className="collapse-content text--1 bg-base-200">
          <fieldset className="fieldset pt-2">
            <label className="label">Name</label>
            <input
              type="text"
              value={sceneName}
              onChange={changeSceneName}
              onBlur={saveSceneName}
              className="input"
              placeholder="Awesome Scene"
            />
            <label className="label">Timer Duration (seconds)</label>
            <input
              type="number"
              min="1"
              value={timerDuration}
              onChange={(e) => setTimerDuration(e.target.value)}
              onBlur={saveTimerDuration}
              className="input"
              placeholder="No timer"
            />
            {time > 0 && <TimerStateOperationMenu />}
            <label className="label">Roles</label>
            <div className="dropdown" onBlur={saveSceneRoles}>
              <div
                tabIndex={0}
                role="button"
                className="justify-between input mb-1 font-normal w-full"
              >
                <span className="truncate">
                  {selectedRoles?.join(", ") || "All"}
                </span>
                <ChevronDown className="shrink-0" size={16} />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-300 rounded-box z-1 w-full p-2 shadow-sm"
              >
                {roleList?.map((role, i) => {
                  const active = selectedRoles.includes(role);
                  return (
                    <li
                      className={active ? "text-secondary" : "text-primary"}
                      key={i}
                    >
                      <a onClick={() => changeRole(role, !active)}>
                        {role}
                        {active && <Check className="ml-auto" size={14} />}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <label className="label cursor-pointer justify-start gap-3 mt-2 mb-2">
              <input
                type="checkbox"
                className="toggle"
                checked={!!directLink && !directLinkDisabled}
                disabled={directLinkDisabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (!checked) {
                    modifySceneProp("directLink", null);
                    return;
                  }
                  const selfId = useVisualScene.getState().id;
                  const target =
                    directLink ??
                    defaultDirectLinkScene ??
                    scenes?.find((s) => s._id !== selfId)?._id ??
                    null;
                  modifySceneProp("directLink", target);
                }}
              />

              <span className="label-text">Direct Link</span>
              {directLinkDisabled && (
                <span
                  className="tooltip tooltip-warning tooltip-top cursor-help text-warning text-xs before:!whitespace-normal before:!max-w-[150px] before:!text-[0.75rem]"
                  data-tip={
                    "Disabled: scene has buttons leading to multiple different scenes"
                  }
                >
                  ⚠
                </span>
              )}
              <span
                className="label-text tooltip tooltip-top cursor-help before:!whitespace-normal before:!max-w-[130px] before:!text-[0.75rem]"
                data-tip="The player will be sent to this scene when they press either the 'space' or 'right arrow' keyboard button, instead of having to click an on screen element."
              >
                ⓘ
              </span>
            </label>
            <SelectInput
              nullable
              disabled={!directLink || directLinkDisabled}
              value={directLink}
              values={
                scenes
                  ?.filter((scene) => scene._id !== sceneId)
                  .map((scene) => scene._id) ?? []
              }
              display={(targetId) =>
                scenes?.find((scene) => scene._id === targetId)?.name ??
                "Unknown scene"
              }
              onChange={(targetId) =>
                modifySceneProp("directLink", targetId || null)
              }
            />
          </fieldset>
        </div>
      </div>
    </>
  );
}
