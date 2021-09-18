import React from "react";
import { render } from "@testing-library/react";
import ImageComponent from "../ImageComponent";

test("Add image component snapshot test", () => {
  const { baseElement } = render(<ImageComponent component={{}} />);

  expect(baseElement).toMatchSnapshot();
});
