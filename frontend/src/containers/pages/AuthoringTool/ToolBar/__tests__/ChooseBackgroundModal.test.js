import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ToolbarContextProvider from "../../../../../context/ToolbarContextProvider";
import ChooseBackgroundModal from "../Background/ChooseBackgroundModal";

test("ChooseBackgroundModal component snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContextProvider>
          <SceneContextProvider>
            <ToolbarContextProvider>
              <ChooseBackgroundModal isShowing />
            </ToolbarContextProvider>
          </SceneContextProvider>
        </ScenarioContextProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
