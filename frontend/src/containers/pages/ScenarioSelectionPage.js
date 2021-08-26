import React, { useContext, useEffect } from "react";
import SideBar from "../../components/SideBar";
import ListContainer from "../../components/ListContainer";
import ScreenContainer from "../../components/ScreenContainer";
import ScenarioContext from "../../context/ScenarioContext";

export default function ScenarioSelectionPage({ data = null }) {
  const { scenarios, setCurrentScenario, reFetch } =
    useContext(ScenarioContext);

  useEffect(() => {
    setCurrentScenario(null);
    reFetch();
  }, []);

  return (
    <ScreenContainer>
      <SideBar />
      <ListContainer
        data={data || scenarios}
        onItemSelected={setCurrentScenario}
      />
    </ScreenContainer>
  );
}
