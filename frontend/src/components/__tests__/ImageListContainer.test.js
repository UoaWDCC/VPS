import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ImageListContainer from "../ImageListContainer";

test("ImageListContainer component snapshot test", () => {
  const testData = [
    {
      _id: "1",
      url: "https://drive.google.com/uc?export=view&id=18XRH_KNKSjhjTKxonEinMSZXnK1OU2at",
    },
    {
      _id: "2",
      url: "https://drive.google.com/uc?export=view&id=1FNZEXQhXc9ieGbnSBBHJ3FfXeMIMai7w",
    },
  ];
  const component = renderer.create(
    <BrowserRouter>
      <ImageListContainer data={testData} />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
