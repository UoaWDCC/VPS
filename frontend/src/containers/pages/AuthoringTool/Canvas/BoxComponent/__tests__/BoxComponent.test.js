import React from "react";
import { render } from "@testing-library/react";
import BoxComponent from "../BoxComponent";

test("Scenario Selection page snapshot test", () => {
  const { baseElement } = render(<BoxComponent />);

  expect(baseElement).toMatchSnapshot();
});
