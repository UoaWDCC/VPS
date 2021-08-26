import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ScreenContainer from "../ScreenContainer";

test("ScreenContainer component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScreenContainer>
        <div>test</div>
        <div>test</div>
      </ScreenContainer>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
