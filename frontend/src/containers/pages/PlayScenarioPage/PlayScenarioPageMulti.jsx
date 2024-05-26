import { useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import AuthenticationContext from "context/AuthenticationContext";
import { usePost, usePut } from "hooks/crudHooks";
import LoadingPage from "../LoadingPage";
import NotesDisplayCard from "../../../components/NotesDisplayCard";
import ScenarioPreloader from "./Components/ScenarioPreloader";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import useStyles from "./playScenarioPage.styles";

/**
 * This page allows users to play a multiplayer scenario.
 *
 * @container
 */
export default function PlayScenarioPageMulti({ graph, group }) {
  const { user, getUserIdToken: token } = useContext(AuthenticationContext);
  const { scenarioId, sceneId } = useParams();
  const history = useHistory();
  const styles = useStyles();

  const currScene = graph?.getScene(sceneId);

  if (!currScene || !group) return <LoadingPage text="Loading contents..." />;

  const incrementor = (nextSceneId) => {
    graph.visit(nextSceneId);
    if (graph.isEndScene(nextSceneId)) {
      const path = graph.getPath();
      usePut(`/api/user/${user.uid}`, { scenarioId, path }, token);
      path.forEach((id) => {
        usePut(`/api/scenario/${scenarioId}/scene/visited/${id}`, {}, token);
      });
    }
    history.replace(`/play/${scenarioId}/multiplayer/${nextSceneId}`);
  };

  const validatedIncrementor = async (nextSceneId) => {
    const res = await usePost(
      `/api/group/path/${group._id}`,
      { currentSceneId: sceneId, nextSceneId },
      token
    );
    if (res === "Scene added to path") incrementor(nextSceneId);
    else history.replace(`/play/desync`);
  };

  return (
    <>
      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          <PlayScenarioCanvas
            progress={graph.progress(sceneId)}
            scene={currScene}
            incrementor={validatedIncrementor}
          />
        </div>
      </div>
      {window.location === window.parent.location && (
        <ScenarioPreloader scenarioId={scenarioId} graph={graph} key={1} />
      )}{" "}
      <NotesDisplayCard group={group} user={user} />
    </>
  );
}
