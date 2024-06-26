import { render } from "@testing-library/react";
import AuthenticationContextProvider from "../../../../../../context/AuthenticationContextProvider";
import ScenarioContextProvider from "../../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../../context/SceneContextProvider";
import FirebaseAudioPropertiesComponent from "../FirebaseAudioPropertiesComponent";

test("Firebase audio properties component snapshot test", () => {
  const { baseElement } = render(
    <AuthenticationContextProvider>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <FirebaseAudioPropertiesComponent
            component={{
              type: "FIREBASEAUDIO",
              name: "test.mp3",
              loop: false,
            }}
          />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </AuthenticationContextProvider>
  );

  expect(baseElement).toMatchSnapshot();
});
