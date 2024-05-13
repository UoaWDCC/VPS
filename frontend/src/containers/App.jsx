import { ThemeProvider } from "@material-ui/core";
import "normalize.css";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import AuthenticationContextProvider from "../context/AuthenticationContextProvider";
import ScenarioContextProvider from "../context/ScenarioContextProvider";
import SceneContextProvider from "../context/SceneContextProvider";
import AccessLevel from "../enums/route.access.level";
import ProtectedRoute from "../firebase/ProtectedRoute";
import "../styling/style.scss";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ScenarioSelectionPage from "./pages/ScenarioSelectionPage";
import ManageGroupsPage from "./pages/ManageGroups/ManageGroupsPage";
import { ScenePage } from "./pages/SceneSelectionPage";
import theme from "./theme/App.theme";
import PlayScenarioResolver from "./pages/PlayScenarioPage/PlayScenarioResolver";
import InvalidRolePage from "./pages/InvalidRolePage";

export default function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <AuthenticationContextProvider>
          <BrowserRouter>
            <Switch>
              <ProtectedRoute
                exact
                path="/play/invalid-role"
                component={InvalidRolePage}
              >
                <PlayingScenarioContextProvider>
                  <InvalidRolePage />
                </PlayingScenarioContextProvider>
              </ProtectedRoute>
              <Route exact path="/login" component={LoginPage} />

              <ProtectedRoute path="/play/:scenarioId">
                <PlayScenarioResolver />
              </ProtectedRoute>

              <ProtectedRoute exact path="/">
                <ScenarioContextProvider>
                  <ScenarioSelectionPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ScenarioContextProvider>
                <Switch>
                  <ProtectedRoute index path="/scenario/:scenarioId">
                    <SceneContextProvider>
                      <ScenePage />
                    </SceneContextProvider>
                    <ProtectedRoute path="/scenario/:scenarioId/manage-groups">
                      <ManageGroupsPage />
                    </ProtectedRoute>
                  </ProtectedRoute>
                </Switch>
              </ScenarioContextProvider>

              <ProtectedRoute
                path="/dashboard"
                accessLevelReq={AccessLevel.STAFF}
              >
                <ScenarioContextProvider>
                  <DashboardPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              {/* Default path if nothing matches */}
              <ProtectedRoute path="/">
                <ScenarioContextProvider>
                  <ScenarioSelectionPage />
                </ScenarioContextProvider>
              </ProtectedRoute>
            </Switch>
          </BrowserRouter>
        </AuthenticationContextProvider>
      </ThemeProvider>
    </>
  );
}
