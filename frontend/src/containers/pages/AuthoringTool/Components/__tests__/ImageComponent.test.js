import { render } from "@testing-library/react";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";
import ImageComponent from "../ImageComponent";

test("Add image component snapshot test", () => {
  const { baseElement } = render(
    <AuthenticationContextProvider>
      <ImageComponent component={{}} />
    </AuthenticationContextProvider>
  );

  expect(baseElement).toMatchSnapshot();
});
