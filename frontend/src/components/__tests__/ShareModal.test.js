import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthenticationContextProvider from "../../context/AuthenticationContextProvider";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContextProvider from "../../context/SceneContextProvider";
import ShareModal from "../ShareModal";

test("ShareModal component snapshot test", () => {
  const context = {
    currentScenario: { _id: "test" },
  };

  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContext.Provider value={context}>
          <SceneContextProvider>
            <ShareModal isOpen />
          </SceneContextProvider>
        </ScenarioContext.Provider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
