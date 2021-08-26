import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import DashedCard from "../DashedCard";

test("Dashed Card component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <DashedCard />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
