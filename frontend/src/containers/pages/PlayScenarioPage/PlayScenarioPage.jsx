import { useContext } from "react";
import PlayScenarioContext from "../../../context/PlayScenarioContext";
import useGraph from "../../../hooks/useGraph";
import LoadingPage from "../LoadingPage";
import ScenarioPreloader from "./Components/ScenarioPreloader";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import useStyles from "./playScenarioPage.styles";

/**
 * This page allows users to play a scenario.
 *
 * @container
 */
export default function PlayScenarioPage() {
  const styles = useStyles();
  const { currentSceneId, scenarioId } = useContext(PlayScenarioContext);
  const { isLoading, graph } = useGraph(scenarioId);

  if (currentSceneId === null || isLoading) {
    return <LoadingPage text="Loading contents..." />;
  }

  return (
    <>
      {currentSceneId && (
        <div className={styles.canvasContainer}>
          <div className={styles.canvas}>
            <PlayScenarioCanvas
              progress={graph.progress(currentSceneId)}
              graph={graph}
            />
          </div>
        </div>
      )}
      {window.location === window.parent.location ? (
        <ScenarioPreloader key={1} />
      ) : null}
    </>
  );
}
