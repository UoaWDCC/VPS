import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthenticationContextProvider from "../../../../context/AuthenticationContextProvider";
import PlayScenarioPage from "../PlayScenarioPage";

test("PlayScenario page snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <PlayScenarioPage />
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
