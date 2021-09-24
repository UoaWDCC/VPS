import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import SideBar from "../SideBar";
import ScenarioContextProvider from "../../context/ScenarioContextProvider";
import AuthenticationContextProvider from "../../context/AuthenticationContextProvider";

test("Side Bar component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContextProvider>
          <SideBar />
        </ScenarioContextProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
