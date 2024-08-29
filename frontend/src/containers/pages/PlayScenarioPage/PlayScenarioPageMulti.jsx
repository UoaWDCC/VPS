import { useContext, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import AuthenticationContext from "context/AuthenticationContext";
import { usePost } from "hooks/crudHooks";
import axios from "axios";
import LoadingPage from "../LoadingPage";
import NotesDisplayCard from "../../../components/NotesDisplayCard";
import ResourcesModal from "../../../components/ResourcesModal";
import PlayPageSideButton from "../../../components/PlayPageSideButton";
// import ScenarioPreloader from "./Components/ScenarioPreloader";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import useStyles from "./playScenarioPage.styles";

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
const getResources = async (
  user,
  groupId
) => {
  const token = await user.getIdToken();
  const config = {
    method: "get",
    url: `/api/resources/${groupId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  };
  const res = await axios.request(config);
  console.log(res);
  return res.data.active;
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
  const styles = useStyles();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [previous, setPrevious] = useState(null);
  const [addFlags, setAddFlags] = useState([]);
  const [removeFlags, setRemoveFlags] = useState([]);
  const [resources, setResources] = useState([]);

  const handleError = (error) => {
    if (!error) return;
    if (error.status === 409) {
      history.push(`/play/${scenarioId}/desync`);
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
        const newResources = await getResources( 
          user,
          group._id
        );
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
    const res = await usePost(
      `api/navigate/group/reset/${group._id}`,
      { currentScene: sceneId },
      user.getIdToken.bind(user)
    );
    if (res.status) {
      handleError(res);
      return;
    }

    console.log("reset");
    setPrevious(null);
    history.replace(`/play/${scenarioId}/multiplayer`);
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
      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          <PlayScenarioCanvas
            scene={currScene}
            incrementor={incrementor}
            reset={reset}
            setAddFlags={setAddFlags}
            setRemoveFlags={setRemoveFlags}
          />
        </div>
      </div>
      {/* {window.location === window.parent.location && (
        <ScenarioPreloader scenarioId={scenarioId} graph={graph} key={1} />
      )}{" "} */}
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
          group={group}
          user={user}
          handleClose={() => setResourcesOpen(false)}
        />
      )}
    </>
  );
}
