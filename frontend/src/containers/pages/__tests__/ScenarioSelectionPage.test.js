import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ScenarioSelectionPage from "../ScenarioSelectionPage";
import ScenarioContextProvider from "../../../context/ScenarioContextProvider";

const dummyScenarios = [
  { id: 1, name: "test1" },
  { id: 2, name: "test2" },
];

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContextProvider>
        <ScenarioSelectionPage data={dummyScenarios} />
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
