import { render } from "@testing-library/react";
import FirebaseImageComponent from "../FirebaseImageComponent";

test("Add firebase image component snapshot test", () => {
  const { baseElement } = render(<FirebaseImageComponent component={{}} />);

  expect(baseElement).toMatchSnapshot();
});
