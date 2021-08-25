import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import RowContainer from "../RowContainer";

test("RowContainer component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <RowContainer>
        <div>test</div>
        <div>test</div>
      </RowContainer>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
