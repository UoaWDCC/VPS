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

import ManageResourcesPage from "./features/resources/ManageResourcesPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const TOAST_OFFSET = 25;

const queryClient = new QueryClient();

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

      {/* DialogModal container */}
      <div
        id="modal-portal"
        className="fixed inset-0 z-[9999] pointer-events-none"
      />

      {/* ContextMenu container */}
      <ContextMenuPortal />

      {/* Routes */}
      <ThemeProvider theme={theme}>
        <AuthenticationContextProvider>
<<<<<<< HEAD
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
=======
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <Switch>
                <Route exact path="/login" component={LoginPage} />

                <ProtectedRoute exact path="/">
                  <ScenarioContextProvider>
                    <ScenarioSelectionPage />
                  </ScenarioContextProvider>
                </ProtectedRoute>
>>>>>>> origin/master

                <ProtectedRoute path="/scenario-info">
                  <ScenarioContextProvider>
                    <ScenarioInfo />
                  </ScenarioContextProvider>
                </ProtectedRoute>

                <ProtectedRoute path="/play/:scenarioId">
                  <PlayScenarioResolver />
                </ProtectedRoute>

<<<<<<< HEAD
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
=======
                <ProtectedRoute path="/dashboard/:scenarioId">
                  <ScenarioContextProvider>
                    <SceneContextProvider>
                      <Dashboard />
                    </SceneContextProvider>
                  </ScenarioContextProvider>
                </ProtectedRoute>

                <ProtectedRoute path="/play-page">
                  <ScenarioContextProvider>
                    <PlayPage />
                  </ScenarioContextProvider>
                </ProtectedRoute>

                <ScenarioContextProvider>
                  <Switch>
                    <ProtectedRoute path="/scenario/:scenarioId/manage-resources">
                      <ManageResourcesPage />
                    </ProtectedRoute>
                    <ProtectedRoute path="/scenario/:scenarioId/manage-groups">
                      <ManageGroupsPage />
                    </ProtectedRoute>
                    <ProtectedRoute index path="/scenario/:scenarioId">
                      <SceneContextProvider>
                        <ScenePage />
                      </SceneContextProvider>
                    </ProtectedRoute>
                  </Switch>
>>>>>>> origin/master
                </ScenarioContextProvider>
              </Switch>
            </BrowserRouter>
          </QueryClientProvider>
        </AuthenticationContextProvider>
      </ThemeProvider>
    </>
  );
}
