import React, { useContext } from "react";
import useStyles from "./playingScenarioPage.styles";
import PlayingScenarioContext from "../../../context/PlayingScenarioContext";
import PlayingScenarioCanvas from "./PlayingScenarioCanvas";
import LoadingPage from "../LoadingPage";

export default function PlayScenarioPage() {
  const styles = useStyles();
  const { currentSceneId } = useContext(PlayingScenarioContext);

  if (!currentSceneId) {
    return <LoadingPage />;
  }

  return (
    <>
      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          <PlayingScenarioCanvas />
        </div>
      </div>
    </>
  );
}
