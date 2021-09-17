import React from "react";
import { render } from "@testing-library/react";
import TextComponent from "../TextComponent";

test("Add text component snapshot test", () => {
  const { baseElement } = render(
    <TextComponent
      component={{
        type: "TEXT",
        text: "default text",
        left: 50,
        top: 50,
        height: 10,
        width: 20,
      }}
    />
  );

  expect(baseElement).toMatchSnapshot();
});
