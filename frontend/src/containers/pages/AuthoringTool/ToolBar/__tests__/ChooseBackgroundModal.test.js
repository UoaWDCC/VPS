import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ChooseBackgroundModal from "../Background/ChooseBackgroundModal";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import ToolbarContextProvider from "../../../../../context/ToolbarContextProvider";

test("ChooseBackgroundModal component snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <ToolbarContextProvider>
            <ChooseBackgroundModal isShowing />
          </ToolbarContextProvider>
        </SceneContextProvider>
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
