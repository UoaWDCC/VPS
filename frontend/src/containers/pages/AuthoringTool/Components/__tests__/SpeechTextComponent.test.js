import { render } from "@testing-library/react";
import SpeechTextComponent from "../SpeechTextComponent";

test("Add speech text component snapshot test", () => {
  const { baseElement } = render(
    <SpeechTextComponent
      component={{
        type: "SPEECHTEXT",
        text: "default speech text",
        left: 50,
        top: 50,
        height: 10,
        width: 20,
      }}
    />
  );

  expect(baseElement).toMatchSnapshot();
});
