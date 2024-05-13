import { render } from "@testing-library/react";
import AuthenticationContextProvider from "../../../../../../context/AuthenticationContextProvider";
import ScenarioContextProvider from "../../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../../context/SceneContextProvider";
import ImagePropertiesComponent from "../ImagePropertiesComponent";

test("Image properties component snapshot test", () => {
  const { baseElement } = render(
    <AuthenticationContextProvider>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <ImagePropertiesComponent
            component={{
              type: "FIREBASEIMAGE",
              nextScene: "",
            }}
          />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </AuthenticationContextProvider>
  );

  expect(baseElement).toMatchSnapshot();
});
