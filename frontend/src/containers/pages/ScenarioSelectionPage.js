import React, { useContext, useEffect } from "react";
import SideBar from "../../components/SideBar";
import ListContainer from "../../components/ListContainer";
import ScreenContainer from "../../components/ScreenContainer";
import ScenarioContext from "../../context/ScenarioContext";

const axios = require("axios");

export default function ScenarioSelectionPage({ useTestData }) {
  const { scenarios, setScenarios, setCurrentScenario } =
    useContext(ScenarioContext);
  useEffect(() => {
    setCurrentScenario(null);
  }, []);
  useEffect(() => {
    if (useTestData) {
      // fill with dummy data
      const testData = [];
      for (let i = 1; i < 30; i += 1) {
        testData.push({
          id: i,
          name: `Scenario ${i}`,
        });
      }
      setScenarios(testData);
    } else {
      // fetch scenarios
      axios.get("api/scenario").then((response) => {
        const processedData = [];
        response.data.map((item) =>
          processedData.push({
            // eslint-disable-next-line dot-notation
            id: item["_id"],
            name: item.name,
          })
        );
        setScenarios(processedData);
      });
    }
  }, []);

  return (
    <ScreenContainer>
      <SideBar />
      <ListContainer data={scenarios} onItemSelected={setCurrentScenario} />
    </ScreenContainer>
  );
}
