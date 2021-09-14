import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ListContainer from "../ListContainer";

test("ListContainer component snapshot test", () => {
  const testData = [
    {
      _id: 1,
      name: "Scenario 1",
      img: "",
    },
  ];
  const component = renderer.create(
    <BrowserRouter>
      <ListContainer data={testData} />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
