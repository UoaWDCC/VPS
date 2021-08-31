import React, { useContext } from "react";
import TopBar from "../../../components/TopBar";
import ToolBar from "./ToolBar";
import ScreenContainer from "../../../components/ScreenContainer";
import ScenarioContext from "../../../context/ScenarioContext";

export default function AuthoringToolPage() {
  const { currentScenario } = useContext(ScenarioContext);
  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${currentScenario?._id}`} />
        <ToolBar />
        <h1>Authoring Tool Page</h1>
      </ScreenContainer>
    </>
  );
}
