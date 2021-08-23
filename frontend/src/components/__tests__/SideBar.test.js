import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import SideBar from "../SideBar";

test("Side Bar component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <SideBar />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
