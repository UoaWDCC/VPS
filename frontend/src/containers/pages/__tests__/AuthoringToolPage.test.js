import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import AuthoringToolPage from "../AuthoringToolPage";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <AuthoringToolPage />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
