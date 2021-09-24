import React from "react";
import { render } from "@testing-library/react";
import ScenarioContextProvider from "../../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../../context/SceneContextProvider";
import ButtonPropertiesComponent from "../ButtonPropertiesComponent";
import AuthenticationContextProvider from "../../../../../../context/AuthenticationContextProvider";

test("Button properties component snapshot test", () => {
  const { baseElement } = render(
    <AuthenticationContextProvider>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <ButtonPropertiesComponent
            component={{
              type: "BUTTON",
              variant: "contained",
              colour: "white",
              nextScene: "",
            }}
          />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </AuthenticationContextProvider>
  );

  expect(baseElement).toMatchSnapshot();
});
