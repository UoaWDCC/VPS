import React from "react";
import { render } from "@testing-library/react";
import AudioComponent from "../AudioComponent";

test("Add firebase audio component snapshot test", () => {
  const { baseElement } = render(<AudioComponent component={{}} />);

  expect(baseElement).toMatchSnapshot();
});
