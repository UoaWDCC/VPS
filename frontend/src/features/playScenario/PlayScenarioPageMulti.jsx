import { useContext, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";

import AuthenticationContext from "context/AuthenticationContext";
import { usePost } from "hooks/crudHooks";

import LoadingPage from "../status/LoadingPage";
import NotesDisplayCard from "./modals/NotesModal/NotesModal";
import ResourcesModal from "./modals/ResourcesModal/ResourcesModal";
import PlayPageSideButton from "./components/PlayPageSideButton/PlayPageSideButton";
import PlayScenarioCanvas from "./PlayScenarioCanvas";

const sceneCache = new Map();

// returns the scene id that we should switch to
const navigate = async (
  user,
  groupId,
  currentScene,
  nextScene,
  addFlags,
  removeFlags
) => {
  const token = await user.getIdToken();
  const config = {
    method: "post",
    url: `/api/navigate/group/${groupId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { currentScene, nextScene, addFlags, removeFlags },
  };
  const res = await axios.request(config);
  res.data.scenes.forEach((scene) => sceneCache.set(scene._id, scene));
  return res.data.active;
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

  const { scenarioId, sceneId } = useParams();
  const history = useHistory();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [previous, setPrevious] = useState(null);
  const [addFlags, setAddFlags] = useState([]);
  const [removeFlags, setRemoveFlags] = useState([]);
  const [resources, setResources] = useState([]);

  const reload = () => {
    setPrevious(null);
    history.replace(`/play/${scenarioId}/multiplayer`);
  };

  const handleError = (error) => {
    if (!error) return;
    if (error.status === 409) {
      reload();
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

  useEffect(() => {
    const onSceneChange = async () => {
      if (sceneId && !previous) return;
      if (sceneCache.get(sceneId)?.error) handleError(sceneCache.get(sceneId));
      try {
        const newSceneId = await navigate(
          user,
          group._id,
          previous,
          sceneId,
          addFlags,
          removeFlags
        );
        const newResources = await getResources(user, group._id);
        setResources(newResources);
        if (!sceneId)
          history.replace(`/play/${scenarioId}/multiplayer/${newSceneId}`);
      } catch (e) {
        handleError(e?.response?.data);
      }
    };
    onSceneChange();
  }, [sceneId]);

  const reset = async () => {
    try {
      await usePost(
        `api/navigate/group/reset/${group._id}`,
        { currentScene: sceneId },
        user.getIdToken.bind(user)
      );

      setAddFlags([]);
      setRemoveFlags([]);
      reload();
    } catch (error) {
      console.error("Error during reset:", error);
    }
  };

  if (loading) return <LoadingPage text="Loading Scene..." />;
  if (authError) return <></>;

  const currScene = sceneCache.get(sceneId);
  if (!currScene || !group) return <LoadingPage text="Loading Scene..." />;

  const incrementor = (id) => {
    if (!sceneCache.has(id)) return;
    setPrevious(sceneId);
    history.replace(`/play/${scenarioId}/multiplayer/${id}`);
  };

  return (
    <>
      <div style={{ width: "100vw", height: "100vh" }}>
        <div>
          <PlayScenarioCanvas
            scene={currScene}
            incrementor={incrementor}
            reset={reset}
            setAddFlags={setAddFlags}
            setRemoveFlags={setRemoveFlags}
          />
        </div>
      </div>
      <PlayPageSideButton
        handleOpen={() => setNoteOpen(true)}
        buttonName="Note"
        variant="notes"
      />
      <PlayPageSideButton
        handleOpen={() => setResourcesOpen(true)}
        buttonName="Resources"
        variant="resources"
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
