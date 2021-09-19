import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PlayScenarioPage from "../PlayScenarioPage";
import PlayScenarioContext from "../../../../context/PlayScenarioContext";

test("PlayScenario page snapshot test", () => {
  const context = {
    currentSceneId: "EXISTS",
  };

  const { baseElement } = render(
    <BrowserRouter>
      <PlayScenarioContext.Provider value={context}>
        <PlayScenarioPage />
      </PlayScenarioContext.Provider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});

test("PlayScenario page when no current SceneID snapshot test", () => {
  const context = {
    currentSceneId: null,
  };

  const { baseElement } = render(
    <BrowserRouter>
      <PlayScenarioContext.Provider value={context}>
        <PlayScenarioPage />
      </PlayScenarioContext.Provider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
