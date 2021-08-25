import React, { useContext, useEffect } from "react";
import SideBar from "../../components/SideBar";
import ListContainer from "../../components/ListContainer";
import RowContainer from "../../components/RowContainer";
import ScenarioContext from "../../context/ScenarioContext";

export default function ScenarioSelectionPage() {
  const { scenarios, setScenario } = useContext(ScenarioContext);
  useEffect(() => {
    setScenario(null);
  }, []);
  return (
    <RowContainer>
      <SideBar />
      <ListContainer data={scenarios} onItemSelected={setScenario} />
    </RowContainer>
  );
}
