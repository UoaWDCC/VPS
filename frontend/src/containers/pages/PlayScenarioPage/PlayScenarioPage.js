import React, { useContext } from "react";
import useStyles from "./playScenarioPage.styles";
import PlayScenarioContext from "../../../context/PlayScenarioContext";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import LoadingPage from "../LoadingPage";

export default function PlayScenarioPage() {
  const styles = useStyles();
  const { currentSceneId } = useContext(PlayScenarioContext);

  if (!currentSceneId) {
    return <LoadingPage text="Loading contents..." />;
  }

  return (
    <>
      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          <PlayScenarioCanvas />
        </div>
      </div>
    </>
  );
}
