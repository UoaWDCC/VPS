import { useEffect } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

import AuthenticationContextProvider from "./context/AuthenticationContextProvider";
import ScenarioContextProvider from "./context/ScenarioContextProvider";
import SceneContextProvider from "./context/SceneContextProvider";
import ProtectedRoute from "./firebase/ProtectedRoute";
import LoginPage from "./features/login/LoginPage/LoginPage";
import ManageGroupsPage from "./features/groups/ManageGroupsPage";
import PlayScenarioResolver from "./features/playScenario/PlayScenarioResolver";
import PlayLandingPage from "./features/playScenario/PlayLandingPage";
import ScenarioInfo from "./features/scenarioInfo/ScenarioInfo";
import Dashboard from "./features/dashboard/Dashboard";
import DashboardLandingPage from "./features/dashboard/DashboardLandingPage";
import AboutUsPage from "./features/aboutUs/AboutUsPage";
import CreateLandingPage from "./features/create/CreateLandingPage";
import ManageResourcesPage from "./features/resources/ManageResourcesPage";

import "./styles/style.scss";

import { Toaster } from "react-hot-toast";
import { ContextMenuPortal } from "./components/ContextMenu/portal";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthoringToolPage from "./features/authoring/AuthoringToolPage";

const TOAST_OFFSET = 25;

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("vps-theme");
    if (savedTheme === "vps-light" || savedTheme === "vps-dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "vps-dark");
      localStorage.setItem("vps-theme", "vps-dark");
    }
  }, []);

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
      <AuthenticationContextProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Switch>
              <Route exact path="/login" component={LoginPage} />

              <ProtectedRoute exact path="/">
                <Redirect to="/play" />
              </ProtectedRoute>

              <ProtectedRoute path="/play/:scenarioId">
                <PlayScenarioResolver />
              </ProtectedRoute>

              <ProtectedRoute exact path="/play">
                <ScenarioContextProvider>
                  <PlayLandingPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute path="/scenario-info">
                <ScenarioContextProvider>
                  <ScenarioInfo />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute exact path="/dashboard">
                <ScenarioContextProvider>
                  <DashboardLandingPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute path="/dashboard/:scenarioId">
                <ScenarioContextProvider>
                  <Dashboard />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute exact path="/create">
                <ScenarioContextProvider>
                  <CreateLandingPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <Route path="/aboutus" component={AboutUsPage} />

              <ProtectedRoute path="/scenario/:scenarioId">
                <ScenarioContextProvider>
                  <Switch>
                    <ProtectedRoute path="/scenario/:scenarioId/manage-resources">
                      <ManageResourcesPage />
                    </ProtectedRoute>

                    <ProtectedRoute path="/scenario/:scenarioId/manage-groups">
                      <ManageGroupsPage />
                    </ProtectedRoute>

                    <ProtectedRoute path="/scenario/:scenarioId">
                      <SceneContextProvider>
                        <AuthoringToolPage />
                      </SceneContextProvider>
                    </ProtectedRoute>
                  </Switch>
                </ScenarioContextProvider>
              </ProtectedRoute>
            </Switch>
          </BrowserRouter>
        </QueryClientProvider>
      </AuthenticationContextProvider>
    </>
  );
}
