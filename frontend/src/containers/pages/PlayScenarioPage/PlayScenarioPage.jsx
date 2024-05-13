import { useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import AuthenticationContext from "context/AuthenticationContext";
import { usePut } from "hooks/crudHooks";
import LoadingPage from "../LoadingPage";
import ScenarioPreloader from "./Components/ScenarioPreloader";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import useStyles from "./playScenarioPage.styles";

/**
 * This page allows users to play a scenario.
 *
 * @container
 */
export default function PlayScenarioPage({ graph }) {
  const { user, getUserIdToken: token } = useContext(AuthenticationContext);
  const { scenarioId, sceneId } = useParams();
  const history = useHistory();
  const styles = useStyles();

  const currentScene = graph?.getScene(sceneId);

  if (!currentScene) return <LoadingPage text="Loading contents..." />;

  const incrementor = (nextSceneId) => {
    graph.visit(nextSceneId);
    if (graph.isEndScene(nextSceneId)) {
      const path = graph.getPath();
      usePut(`/api/user/${user.uid}`, { scenarioId, path }, token);
      path.forEach((id) => {
        usePut(`/api/scenario/${scenarioId}/scene/visited/${id}`, {}, token);
      });
    }
    history.replace(`/play/${scenarioId}/${nextSceneId}`);
  };

  return (
    <>
      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          <PlayScenarioCanvas
            progress={graph.progress(sceneId)}
            scene={currentScene}
            incrementor={incrementor}
          />
        </div>
      </div>
      {window.location === window.parent.location && (
        <ScenarioPreloader scenarioId={scenarioId} graph={graph} key={1} />
      )}
    </>
  );
}
