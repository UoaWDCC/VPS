import { ThemeProvider } from "@material-ui/core";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import AuthenticationContextProvider from "./context/AuthenticationContextProvider";
import ScenarioContextProvider from "./context/ScenarioContextProvider";
import SceneContextProvider from "./context/SceneContextProvider";
// import AccessLevel from "./enums/route.access.level";
import ProtectedRoute from "./firebase/ProtectedRoute";
import "./styles/style.scss";
import LoginPage from "./features/login/LoginPage/LoginPage";
import ManageGroupsPage from "./features/groups/ManageGroupsPage";
import PlayScenarioResolver from "./features/playScenario/PlayScenarioResolver";
import ScenarioSelectionPage from "./features/scenarioSelection/ScenarioSelectionPage";
import { ScenePage } from "./features/sceneSelection/SceneSelectionPage";
import theme from "./theme/App.theme";

import { Toaster } from "react-hot-toast";
import { ContextMenuPortal } from "./components/ContextMenu/portal";

const TOAST_OFFSET = 25;

export default function App() {
  return (
    <>
      {/* Toaster container */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            padding: "1rem",
          },
        }}
        containerStyle={{
          bottom: TOAST_OFFSET,
          right: TOAST_OFFSET,
        }}
      />

      <ContextMenuPortal />

      {/* Routes */}
      <ThemeProvider theme={theme}>
        <AuthenticationContextProvider>
          <BrowserRouter>
            <Switch>
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

              {/* <ProtectedRoute
                path="/dashboard"
                accessLevelReq={AccessLevel.STAFF}
              >
                <ScenarioContextProvider>
                  <DashboardPage />
                </ScenarioContextProvider>
              </ProtectedRoute> */}

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
