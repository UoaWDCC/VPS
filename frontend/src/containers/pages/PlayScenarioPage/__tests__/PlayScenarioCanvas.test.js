import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthenticationContextProvider from "../../../../context/AuthenticationContextProvider";
import PlayScenarioCanvas from "../PlayScenarioCanvas";

test("PlayScenarioCanvas component snapshot test", () => {
  const scene = {
    name: "Scene 0",
    _id: "66373e81dc2663410c735553",
    visited: 29,
    components: [
      {
        type: "TEXT",
        text: "default text",
        border: true,
        fontSize: 16,
        color: "black",
        textAlign: "left",
        left: 0,
        top: 0,
        height: 10,
        width: 20,
        id: "b1b514a5-c749-406d-b25b-f51feb048d26",
      },
      {
        type: "BUTTON",
        text: "Button",
        variant: "contained",
        colour: "white",
        nextScene: "66373e89dc2663410c735565",
        left: 36.9622475856014,
        top: 52.574102964118566,
        height: 6,
        width: 20,
        id: "4dd3e278-6c6e-4ec7-a330-c798b58e8945",
      },
    ],
  };

  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <PlayScenarioCanvas
          progress={0.5}
          scene={scene}
          incrementer={() => {}}
        />
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
