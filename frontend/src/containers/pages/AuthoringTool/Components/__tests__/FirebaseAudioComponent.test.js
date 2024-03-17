import { render } from "@testing-library/react";
import FirebaseAudioComponent from "../FirebaseAudioComponent";

test("Add firebase audio component snapshot test", () => {
  const { baseElement } = render(<FirebaseAudioComponent component={{}} />);

  expect(baseElement).toMatchSnapshot();
});
