import { useContext, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

import AuthenticationContext from "context/AuthenticationContext";
import { usePost } from "hooks/crudHooks";

import LoadingPage from "../status/LoadingPage";
import NotesDisplayCard from "./modals/NotesModal/NotesModal";
import ResourcesModal from "./modals/ResourcesModal/ResourcesModal";
import PlayPageSideButton from "./components/PlayPageSideButton/PlayPageSideButton";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import { applyStateOperations } from "../../components/StateVariables/stateOperations";
import { filterResourcesByConditions } from "../../utils/stateConditionalEvaluator";

const sceneCache = new Map();

// returns the scene id that we should switch to
const navigate = async (
  user,
  groupId,
  currentScene,
  addFlags,
  removeFlags,

  componentId
) => {
  const token = await user.getIdToken();
  const config = {
    method: "post",
    url: `/api/navigate/group/${groupId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { currentScene, addFlags, removeFlags, componentId },
  };
  const res = await axios.request(config);
  if (res.data.scenes) {
    res.data.scenes.forEach((scene) => sceneCache.set(scene._id, scene));
  }
  return {
    newSceneId: res.data.active,
    stateVariables: res.data.stateVariables,
    newStateVersion: res.data.stateVersion,
  };
};

// returns resources in the scene
const getResources = async (user, groupId) => {
  const token = await user.getIdToken();
  const config = {
    method: "get",
    url: `/api/navigate/group/resources/${groupId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  const res = await axios.request(config);
  return res.data;
};

/**
 * This page allows users to play a multiplayer scenario.
 *
 * @container
 */
export default function PlayScenarioPageMulti({ group }) {
  const { user, loading, error: authError } = useContext(AuthenticationContext);

  const { scenarioId } = useParams();
  const history = useHistory();

  const [sceneId, setSceneId] = useState(null);
  const [stateVariables, setStateVariables] = useState([]);
  const [stateVersion, setStateVersion] = useState(0);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [addFlags, setAddFlags] = useState([]);
  const [removeFlags, setRemoveFlags] = useState([]);
  const [resources, setResources] = useState([]);

  const currScene = sceneCache.get(sceneId);

  const handleError = (error) => {
    if (!error) return;
    if (error.status === 409) {
      onSceneChange();
      toast.success(
        "Someone else made a move first, but you're back on track!"
      );
    } else if (error.status === 403) {
      const roles = JSON.stringify(error.meta.roles_with_access);
      history.push(`/play/${scenarioId}/invalid-role?roles=${roles}`);
    } else {
      history.push(`/play/${scenarioId}/error`);
    }
  };

  const onSceneChange = async (componentId) => {
    if (componentId) {
      // Apply state operations if any
      // Find the component by id in the components array
      const component = currScene?.components?.find(
        (comp) => comp.id === componentId
      );
      const stateOperations = component?.stateOperations;
      if (stateOperations) {
        setStateVersion(stateVersion + 1);
        setStateVariables(
          applyStateOperations(stateVariables, stateOperations)
        );
      }
    }
    try {
      const { newSceneId, stateVariables, newStateVersion } = await navigate(
        user,
        group._id,
        sceneId,
        addFlags,
        removeFlags,
        componentId
      );
      const newResources = await getResources(user, group._id);
      const filteredResources = filterResourcesByConditions(
        newResources,
        stateVariables
      );
      setResources(filteredResources);

      // Updates state variables if there is a desync
      if (stateVersion < newStateVersion) {
        setStateVariables(stateVariables);
        setStateVersion(newStateVersion);
      }
      if (!sceneId && newSceneId) {
        setSceneId(newSceneId);
      }
    } catch (e) {
      handleError(e?.response?.data);
    }
  };

  useEffect(() => {
    onSceneChange();
  }, []);

  const buttonPressed = async (component) => {
    const currentSceneId = sceneId;
    const nextSceneId = component.nextScene;
    if (nextSceneId) {
      if (!sceneCache.has(nextSceneId)) return;

      if (sceneCache.get(nextSceneId)?.error)
        handleError(sceneCache.get(nextSceneId));

      setSceneId(nextSceneId);
    }
    onSceneChange(component.id, currentSceneId);
  };

  const reset = async () => {
    try {
      await usePost(
        `api/navigate/group/reset/${group._id}`,
        { currentScene: sceneId },
        user.getIdToken.bind(user)
      );

      setAddFlags([]);
      setRemoveFlags([]);
      onSceneChange();
    } catch (error) {
      console.error("Error during reset:", error);
    }
  };

  if (loading) return <LoadingPage text="Loading Scene..." />;
  if (authError) return <></>;

  if (!currScene || !group) return <LoadingPage text="Loading Scene..." />;

  const incrementor = (id) => {
    if (!sceneCache.has(id)) return;
    history.replace(`/play/${scenarioId}/multiplayer/${id}`);
  };

  return (
    <>
      <PlayScenarioCanvas
        scene={currScene}
        incrementor={incrementor}
        reset={reset}
        setAddFlags={setAddFlags}
        setRemoveFlags={setRemoveFlags}
        buttonPressed={buttonPressed}
        stateVariables={stateVariables}
      />
      <PlayPageSideButton
        setNoteOpen={setNoteOpen}
        setResourcesOpen={setResourcesOpen}
      />

      {noteOpen && (
        <NotesDisplayCard
          group={group}
          user={user}
          handleClose={() => setNoteOpen(false)}
        />
      )}
      {resourcesOpen && (
        <ResourcesModal
          resources={resources}
          group={group}
          user={user}
          handleClose={() => setResourcesOpen(false)}
        />
      )}
    </>
  );
}
