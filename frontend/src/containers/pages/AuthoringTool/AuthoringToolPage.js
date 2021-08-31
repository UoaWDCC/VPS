import React, { useContext } from "react";
import TopBar from "../../../components/TopBar";
import ToolBar from "./ToolBar";
import Canvas from "./Canvas";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import ScreenContainer from "../../../components/ScreenContainer";
import ScenarioContext from "../../../context/ScenarioContext";

export default function AuthoringToolPage() {
  const { currentScenario } = useContext(ScenarioContext);
  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${currentScenario?._id}`} />
        <ToolBar />
        <div className="flex" style={{ height: "100%" }}>
          <Canvas />
          <CanvasSideBar />
        </div>
      </ScreenContainer>
    </>
  );
}
