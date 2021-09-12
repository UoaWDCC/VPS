import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import BackModal from "../BackModal";
import ScenarioContext from "../../../../context/ScenarioContext";

test("BackModal component snapshot test", () => {
  const context = {
    currentScenario: { _id: "test" },
  };

  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContext.Provider value={context}>
        <BackModal isOpen />
      </ScenarioContext.Provider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
