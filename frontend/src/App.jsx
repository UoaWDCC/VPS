import { ThemeProvider } from "@material-ui/core";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import AuthenticationContextProvider from "./context/AuthenticationContextProvider";
import ScenarioContextProvider from "./context/ScenarioContextProvider";
import SceneContextProvider from "./context/SceneContextProvider";
import ProtectedRoute from "./firebase/ProtectedRoute";
import "./styles/style.scss";
import LoginPage from "./features/login/LoginPage/LoginPage";
import ManageGroupsPage from "./features/groups/ManageGroupsPage";
import PlayScenarioResolver from "./features/playScenario/PlayScenarioResolver";
import PlayLandingPage from "./features/playScenario/PlayLandingPage";
import ScenarioSelectionPage from "./features/scenarioSelection/ScenarioSelectionPage";
import ScenarioInfo from "./features/scenarioInfo/ScenarioInfo";
import PlayPage from "./features/play/PlayPage";
import Dashboard from "./features/dashboard/Dashboard";
import { ScenePage } from "./features/sceneSelection/SceneSelectionPage";
import theme from "./theme/App.theme";
import { Toaster } from "react-hot-toast";
import { ContextMenuPortal } from "./components/ContextMenu/portal";
import CreateLandingPage from "./features/create/CreateLandingPage"; // Verify this path

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
              {/* Public Route */}
              <Route exact path="/login" component={LoginPage} />

              {/* Protected Routes */}
              <ProtectedRoute exact path="/play">
                <ScenarioContextProvider>
                  <PlayLandingPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute path="/play/:scenarioId">
                <PlayScenarioResolver />
              </ProtectedRoute>

              <ProtectedRoute path="/scenario-info">
                <ScenarioContextProvider>
                  <ScenarioInfo />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute path="/play-page">
                <ScenarioContextProvider>
                  <PlayPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute exact path="/">
                <ScenarioContextProvider>
                  <ScenarioSelectionPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute path="/dashboard/:scenarioId">
                <ScenarioContextProvider>
                  <SceneContextProvider>
                    <Dashboard />
                  </SceneContextProvider>
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute path="/scenario/:scenarioId">
                <ScenarioContextProvider>
                  <SceneContextProvider>
                    <ScenePage />
                  </SceneContextProvider>
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute path="/scenario/:scenarioId/manage-groups">
                <ScenarioContextProvider>
                  <ManageGroupsPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              {/* New Create Landing Page Route */}
              <ProtectedRoute exact path="/create">
                <ScenarioContextProvider>
                  <CreateLandingPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              {/* Default Route (Fallback) */}
              <ProtectedRoute path="*">
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