import React, { useContext, useState, useEffect } from "react";
import useStyles from "./playScenarioPage.styles";
import PlayScenarioContext from "../../../context/PlayScenarioContext";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import LoadingPage from "../LoadingPage";
import ScenarioPreloader from "./Components/ScenarioPreloader";
import { useGet } from "../../../hooks/crudHooks";

/**
 * This page allows users to play a scenario.
 *
 * @container
 */
export default function PlayScenarioPage() {
  const styles = useStyles();
  const { scenarioId, currentSceneId } = useContext(PlayScenarioContext);
  const [graph, setGraph] = useState(null);

  useGet(`api/scenario/${scenarioId}/scene/graph`, setGraph, true);

  useEffect(() => {
    console.log(graph);
  }, [graph]);

  if (currentSceneId === null) {
    return <LoadingPage text="Loading contents..." />;
  }

  return (
    <>
      {currentSceneId && (
        <div className={styles.canvasContainer}>
          <div className={styles.canvas}>
            <PlayScenarioCanvas />
          </div>
        </div>
      )}
      {window.location === window.parent.location ? (
        <ScenarioPreloader key={1} />
      ) : null}
    </>
  );
}
