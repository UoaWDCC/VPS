import React from "react";
import SideBar from "../../components/SideBar";
import ListContainer from "../../components/ListContainer";
import RowContainer from "../../components/RowContainer";
import ScenarioContext from "../../context/ScenarioContext";

export default function ScenarioSelectionPage() {
  return (
    <ScenarioContext.Consumer>
      {(context) => (
        <RowContainer>
          <SideBar />
          <ListContainer data={context.scenarios} />
        </RowContainer>
      )}
    </ScenarioContext.Consumer>
  );
}
