import { useContext, useState, useEffect, useRef } from "react";
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
  const [rolesOpen, setRolesOpen] = useState(false);
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const rolesTriggerRef = useRef(null);
  const roleOptionRefs = useRef([]);

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

  useEffect(() => {
    if (rolesOpen) roleOptionRefs.current[activeRoleIndex]?.focus();
  }, [activeRoleIndex, rolesOpen]);

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

  function openRoles(index) {
    if (!roleList?.length) return;
    const selectedIndex = roleList.findIndex((role) =>
      selectedRoles.includes(role)
    );
    setActiveRoleIndex(index ?? (selectedIndex >= 0 ? selectedIndex : 0));
    setRolesOpen(true);
  }

  function closeRoles() {
    setRolesOpen(false);
    rolesTriggerRef.current?.focus();
  }

  function handleRolesBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setRolesOpen(false);
      saveSceneRoles();
    }
  }

  function handleRolesTriggerKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (rolesOpen) closeRoles();
      else openRoles();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openRoles(
        event.key === "ArrowUp" ? (roleList?.length ?? 0) - 1 : undefined
      );
    }
  }

  function handleRoleKeyDown(event, index) {
    const roleCount = roleList?.length ?? 0;
    let nextIndex = index;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        changeRole(roleList[index], !selectedRoles.includes(roleList[index]));
        return;
      case "ArrowDown":
        nextIndex = (index + 1) % roleCount;
        break;
      case "ArrowUp":
        nextIndex = (index - 1 + roleCount) % roleCount;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = roleCount - 1;
        break;
      case "Escape":
        event.preventDefault();
        closeRoles();
        return;
      default:
        return;
    }

    event.preventDefault();
    setActiveRoleIndex(nextIndex);
  }

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
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
            <label className="label">Roles</label>
            <div
              className={`dropdown ${rolesOpen ? "dropdown-open" : ""}`}
              onBlur={handleRolesBlur}
            >
              <button
                ref={rolesTriggerRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={rolesOpen}
                onClick={() => (rolesOpen ? closeRoles() : openRoles())}
                onKeyDown={handleRolesTriggerKeyDown}
                className="justify-between input mb-1 font-normal w-full"
              >
                <span className="truncate">
                  {selectedRoles?.join(", ") || "All"}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`shrink-0 transition-transform ${
                    rolesOpen ? "rotate-180" : ""
                  }`}
                  size={16}
                />
              </button>
              {rolesOpen && (
                <ul
                  role="listbox"
                  aria-multiselectable="true"
                  className="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                  {roleList?.map((role, i) => {
                    const active = selectedRoles.includes(role);
                    return (
                      <li role="none" key={i}>
                        <button
                          ref={(element) => {
                            roleOptionRefs.current[i] = element;
                          }}
                          type="button"
                          role="option"
                          tabIndex={-1}
                          aria-selected={active}
                          className={active ? "text-secondary" : "text-primary"}
                          onClick={() => changeRole(role, !active)}
                          onKeyDown={(event) => handleRoleKeyDown(event, i)}
                        >
                          {role}
                          {active && <Check className="ml-auto" size={14} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <label className="label cursor-pointer justify-start gap-3 mt-2">
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
                  className="tooltip tooltip-warning tooltip-top cursor-help text-warning text-xs before:!whitespace-normal before:!max-w-[150px]"
                  data-tip={
                    "Disabled: scene has buttons leading to multiple different scenes"
                  }
                >
                  ⚠
                </span>
              )}
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
      {time > 0 && <TimerStateOperationMenu />}
    </>
  );
}
