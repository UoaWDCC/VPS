import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ChooseBackgroundModal from "../Background/ChooseBackgroundModal";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";

test("ChooseBackgroundModal component snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <ChooseBackgroundModal isShowing />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
