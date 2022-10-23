import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { ThemeProvider } from "@material-ui/core";
import ScenarioSelectionPage from "./pages/ScenarioSelectionPage";
import PlayScenarioPage from "./pages/PlayScenarioPage/PlayScenarioPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import { ScenePage } from "./pages/SceneSelectionPage";
import ScenarioContextProvider from "../context/ScenarioContextProvider";
import SceneContextProvider from "../context/SceneContextProvider";
import PlayingScenarioContextProvider from "../context/PlayScenarioContextProvider";
import "normalize.css";
import "../styling/style.scss";
import theme from "./theme/App.theme";
import ProtectedRoute from "../firebase/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AuthenticationContextProvider from "../context/AuthenticationContextProvider";
import AccessLevel from "../enums/route.access.level";

export default function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <AuthenticationContextProvider>
          <BrowserRouter>
            <Switch>
              <Route exact path="/login" component={LoginPage} />

              <ProtectedRoute path="/play/:scenarioId/:urlSceneId?">
                <PlayingScenarioContextProvider>
                  <PlayScenarioPage />
                </PlayingScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute exact path="/">
                <ScenarioContextProvider>
                  <ScenarioSelectionPage />
                </ScenarioContextProvider>
              </ProtectedRoute>

              <ProtectedRoute path="/scenario/:scenarioId">
                <ScenarioContextProvider>
                  <SceneContextProvider>
                    <ScenePage />
                  </SceneContextProvider>
                </ScenarioContextProvider>
              </ProtectedRoute>

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
