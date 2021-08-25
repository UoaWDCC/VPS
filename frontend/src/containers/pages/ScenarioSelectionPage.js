import React, { useContext } from "react";
import SideBar from "../../components/SideBar";
import ListContainer from "../../components/ListContainer";
import RowContainer from "../../components/RowContainer";
import ScenarioContext from "../../context/ScenarioContext";

export default function ScenarioSelectionPage() {
  const { scenarios } = useContext(ScenarioContext);
  return (
    <RowContainer>
      <SideBar />
      <ListContainer data={scenarios} />
    </RowContainer>
  );
}
