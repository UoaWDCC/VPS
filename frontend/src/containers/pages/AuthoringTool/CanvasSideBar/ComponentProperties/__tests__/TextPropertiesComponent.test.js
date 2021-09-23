import React from "react";
import { render } from "@testing-library/react";
import ScenarioContextProvider from "../../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../../context/SceneContextProvider";
import TextPropertiesComponent from "../TextPropertiesComponent";
import AuthenticationContextProvider from "../../../../../../context/AuthenticationContextProvider";

test("Button properties component snapshot test", () => {
  const { baseElement } = render(
    <AuthenticationContextProvider>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <TextPropertiesComponent
            component={{
              type: "TEXT",
              text: "default text",
              border: true,
              fontSize: 16, // pt
              color: "black",
              textAlign: "left",
            }}
          />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </AuthenticationContextProvider>
  );

  expect(baseElement).toMatchSnapshot();
});
