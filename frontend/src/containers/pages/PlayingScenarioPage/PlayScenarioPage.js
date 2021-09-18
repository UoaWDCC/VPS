import React, { useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import useStyles from "./playingScenarioPage.styles";
import componentResolver from "./componentResolver";
import PlayingScenarioContext from "../../../context/PlayingScenarioContext";

export default function PlayScenarioPage() {
  const styles = useStyles();
  const { setCurrentScenarioId } = useContext(PlayingScenarioContext);
  const { scenarioId } = useParams();
  console.log(scenarioId);

  useEffect(() => {
    setCurrentScenarioId(scenarioId);
  }, []);

  const componentOnClick = () => {
    console.log("asdf");
  };
  const currentScene = {
    components: [
      {
        type: "TEXT",
        text: "default text",
        left: 50,
        top: 50,
        height: 10,
        width: 20,
      },
    ],
    _id: "6132d3e88aac6e3678f3c6ec",
    name: "Scene 0",
    __v: 0,
  };
  return (
    <>
      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          {currentScene?.components?.map((component, index) =>
            componentResolver(component, index, componentOnClick)
          )}
        </div>
      </div>
    </>
  );
}
