import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthenticationContextProvider from "../../../../context/AuthenticationContextProvider";
import PlayScenarioContext from "../../../../context/PlayScenarioContext";
import PlayScenarioCanvas from "../PlayScenarioCanvas";

test("PlayScenarioCanvas component snapshot test", () => {
  const context = {
    scenarioId: "scenarioID",
    currentSceneId: "scenarioID",
    setCurrentSceneId: () => {},
  };

  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <PlayScenarioContext.Provider value={context}>
          <PlayScenarioCanvas />
        </PlayScenarioContext.Provider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
