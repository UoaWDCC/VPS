import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import TopBar from "../../components/TopBar";
import ListContainer from "../../components/ListContainer";
import ScreenContainer from "../../components/ScreenContainer";
import SceneContext from "../../context/SceneContext";

const axios = require("axios");

export default function SceneSelectionPage({ useTestData }) {
  const { scenarioId } = useParams();
  const { scenes, setScenes, setCurrentScene } = useContext(SceneContext);
  useEffect(() => {
    if (useTestData) {
      // fill with dummy data
      const testData = [];
      for (let i = 1; i < 30; i += 1) {
        testData.push({
          id: i,
          name: `Scene ${i}`,
        });
      }
      setScenes(testData);
    } else if (scenarioId !== "changeThisToDynamicScenarioId") {
      // fetch scenarios
      axios.get(`/api/scenario/${scenarioId}/scene`).then((response) => {
        const processedData = [];
        response.data.map((item) =>
          processedData.push({
            // eslint-disable-next-line dot-notation
            id: item["_id"],
            name: item.name,
          })
        );
        setScenes(processedData);
      });
    } else {
      // TODO remove this else clause when Create button is implemented
      setScenes([]);
    }
  }, []);
  return (
    <ScreenContainer vertical>
      <TopBar />
      <ListContainer
        data={scenes}
        onItemSelected={setCurrentScene}
        placeholderText="No Scenes"
        wide
      />
    </ScreenContainer>
  );
}
