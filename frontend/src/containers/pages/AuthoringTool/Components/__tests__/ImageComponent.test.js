import React from "react";
import { render } from "@testing-library/react";
import ImageComponent from "../ImageComponent";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";

test("Add image component snapshot test", () => {
  const { baseElement } = render(
    <AuthenticationContextProvider>
      <ImageComponent component={{}} />
    </AuthenticationContextProvider>
  );

  expect(baseElement).toMatchSnapshot();
});
