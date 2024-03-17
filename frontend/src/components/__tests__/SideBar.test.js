import { BrowserRouter } from "react-router-dom";
import renderer from "react-test-renderer";
import AuthenticationContextProvider from "../../context/AuthenticationContextProvider";
import ScenarioContextProvider from "../../context/ScenarioContextProvider";
import SideBar from "../SideBar";

test("Side Bar component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContextProvider>
          <SideBar />
        </ScenarioContextProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
