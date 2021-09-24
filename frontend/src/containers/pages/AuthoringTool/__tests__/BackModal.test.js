import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import BackModal from "../BackModal";
import ScenarioContext from "../../../../context/ScenarioContext";
import SceneContextProvider from "../../../../context/SceneContextProvider";
import AuthenticationContextProvider from "../../../../context/AuthenticationContextProvider";

test("BackModal component snapshot test", () => {
  const context = {
    currentScenario: { _id: "scenarioId" },
  };

  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContext.Provider value={context}>
          <SceneContextProvider>
            <BackModal isOpen />
          </SceneContextProvider>
        </ScenarioContext.Provider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
