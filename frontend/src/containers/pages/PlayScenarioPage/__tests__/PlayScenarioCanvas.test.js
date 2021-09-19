import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PlayScenarioCanvas from "../PlayScenarioCanvas";
import PlayScenarioContext from "../../../../context/PlayScenarioContext";

test("PlayScenarioCanvas component snapshot test", () => {
  const context = {
    scenarioId: "scenarioID",
    currentSceneId: "scenarioID",
    setCurrentSceneId: () => {},
  };

  const { baseElement } = render(
    <BrowserRouter>
      <PlayScenarioContext.Provider value={context}>
        <PlayScenarioCanvas />
      </PlayScenarioContext.Provider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
