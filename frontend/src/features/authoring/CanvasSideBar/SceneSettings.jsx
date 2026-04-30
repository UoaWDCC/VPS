import { useContext, useState, useEffect } from "react";
import ScenarioContext from "context/ScenarioContext";
import SceneContext from "context/SceneContext";
import {
  isSceneNameDuplicate,
  generateUniqueSceneName,
} from "../../../utils/sceneUtils";

import useVisualScene from "../stores/visual";
import { modifySceneProp } from "../scene/operations/modifiers";
import shallow from "zustand/shallow";

/**
 * This component displays the settings of a scene, such as the scene name
 * @component
 */
export default function SceneSettings() {
  const { scenes } = useContext(SceneContext);
  const { roleList } = useContext(ScenarioContext);

  const name = useVisualScene((scene) => scene.name);
  const roles = useVisualScene((scene) => scene.roles);
  const directLink = useVisualScene((scene) => scene.directLink);

  const [selectedRoles, setSelectedRoles] = useState(roles ?? []);
  const [sceneName, setSceneName] = useState(name ?? "");

  const components = useVisualScene((scene) => scene.components);
  const directLinkScene = useVisualScene((scene) => scene.directLinkScene);

  // find all linked scenes from clickable components
  const linkedScenes = Object.values(components ?? {})
    .filter((c) => c.clickable && c.nextScene)
    .map((c) => c.nextScene);

  // remove duplicates
  const uniqueLinkedScenes = [...new Set(linkedScenes)];

  // disable if more than 1 possible link
  const directLinkDisabled = uniqueLinkedScenes.length > 1;

  // default target if exactly 1 link exists
  const defaultDirectLinkScene =
    uniqueLinkedScenes.length === 1 ? uniqueLinkedScenes[0] : null;

  // auto-disable if invalid
  useEffect(() => {
    if (directLinkDisabled && directLink) {
      modifySceneProp("directLink", false);
      modifySceneProp("directLinkScene", null);
    }
  }, [directLinkDisabled]);

  useEffect(() => {
    if (!name || name === sceneName) return;
    setSceneName(name);
  }, [name]);

  useEffect(() => {
    if (!roleList || !roles) return;
    const selected = roleList.filter((role) => roles.includes(role));
    if (!shallow(selected, selectedRoles)) setSelectedRoles(selected);
  }, [roleList, roles]);

  function saveSceneRoles() {
    modifySceneProp("roles", selectedRoles);
  }

  function saveSceneName() {
    const name = sceneName.trim();

    if (!name?.length) {
      alert("Scene name cannot be empty.");
      return;
    }

    let final = name;
    const { id: sceneId } = useVisualScene.getState();
    if (isSceneNameDuplicate(name, scenes, sceneId)) {
      console.log("duplicate found, generating unique name...");
      const unique = generateUniqueSceneName(scenes, name);
      alert(`"${name}" already exists, renamed to "${unique}".`);
      final = unique;
    }

    modifySceneProp("name", final);
  }

  function changeSceneName(e) {
    setSceneName(e.target.value);
  }

  function changeRole(role, value) {
    if (value) setSelectedRoles((prev) => [...prev, role]);
    else setSelectedRoles((prev) => prev.filter((r) => r !== role));
  }

  return (
    <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
      <input type="checkbox" />
      <div className="collapse-title">Scene Details</div>
      <div className="collapse-content text--1 bg-base-200">
        <fieldset className="fieldset pt-2">
          {/* input for scene name */}
          <label className="label">Name</label>
          <input
            type="text"
            value={sceneName}
            onChange={changeSceneName}
            onBlur={saveSceneName}
            className="input"
            placeholder="Awesome Scene"
          />
          {/* input for scene roles */}
          <label className="label">Roles</label>
          <div className="dropdown" onBlur={saveSceneRoles}>
            <div
              tabIndex={0}
              role="button"
              className="justify-start input mb-1 font-normal"
            >
              {selectedRoles?.join(", ") || "All"}
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow-sm"
            >
              {roleList?.map((role, i) => {
                const active = selectedRoles.includes(role);
                return (
                  <li
                    className={active ? "text-secondary" : "text-primary"}
                    key={i}
                  >
                    <a onClick={() => changeRole(role, !active)}>{role}</a>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* toggle for direct link */}
          <label className="label cursor-pointer justify-start gap-3 mt-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={!!directLink && !directLinkDisabled}
              disabled={directLinkDisabled}
              onChange={(e) => {
                const checked = e.target.checked;

                modifySceneProp("directLink", checked);

                if (checked && !directLinkScene) {
                  modifySceneProp("directLinkScene", defaultDirectLinkScene);
                }

                if (!checked) {
                  modifySceneProp("directLinkScene", null);
                }
              }}
            />
            <span className="label-text">
              Direct Link
            </span>
          </label>

          {/* warning */}
          {directLinkDisabled && (
            <p className="text-xs text-warning mt-1">
              Direct Link is disabled because this scene has multiple linked elements.
            </p>
          )}

          {/* dropdown for selecting target scene */}
          <select
            className="select select-bordered"
            disabled={!directLink || directLinkDisabled}
            value={directLinkScene ?? ""}
            onChange={(e) => modifySceneProp("directLinkScene", e.target.value || null)}
          >
            <option value="">No direct link target</option>

            {scenes
              ?.filter((scene) => scene._id !== useVisualScene.getState().id)
              .map((scene) => (
                <option key={scene._id} value={scene._id}>
                  {scene.name}
                </option>
              ))}
          </select>
        </fieldset>
      </div>
    </div>
  );
}
