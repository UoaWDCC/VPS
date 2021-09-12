import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import ShareModal from "../ShareModal";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContextProvider from "../../context/SceneContextProvider";

test("ShareModal component snapshot test", () => {
  const context = {
    currentScenario: { _id: "test" },
  };

  const { baseElement } = render(
    <BrowserRouter>
      <ScenarioContext.Provider value={context}>
        <SceneContextProvider>
          <ShareModal isOpen />
        </SceneContextProvider>
      </ScenarioContext.Provider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
