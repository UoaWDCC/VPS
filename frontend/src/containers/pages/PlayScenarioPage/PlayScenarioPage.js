import React, { useContext } from "react";
import useStyles from "./playScenarioPage.styles";
import PlayScenarioContext from "../../../context/PlayScenarioContext";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import LoadingPage from "../LoadingPage";
import ScenarioPreloader from "./Components/ScenarioPreloader";

/**
 * This page allows users to play a scenario.
 *
 * @container
 */
export default function PlayScenarioPage() {
  const styles = useStyles();
  const { currentSceneId } = useContext(PlayScenarioContext);

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
