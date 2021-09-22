import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { ThemeProvider } from "@material-ui/core";
import ScenarioSelectionPage from "./pages/ScenarioSelectionPage";
import PlayScenarioPage from "./pages/PlayScenarioPage/PlayScenarioPage";
import { ScenePage } from "./pages/SceneSelectionPage";
import ScenarioContextProvider from "../context/ScenarioContextProvider";
import SceneContextProvider from "../context/SceneContextProvider";
import PlayingScenarioContextProvider from "../context/PlayScenarioContextProvider";
import "normalize.css";
import "../styling/style.scss";
import theme from "./theme/App.theme";
import ProtectedRoute from "../auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AuthenticationContextProvider from "../context/AuthenticationContextProvider";

export default function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <AuthenticationContextProvider>
          <ScenarioContextProvider>
            <BrowserRouter>
              <Switch>
                <Route exact path="/login" component={LoginPage} />
                <ProtectedRoute
                  exact
                  path="/"
                  component={ScenarioSelectionPage}
                />
                <Route path="/play/:scenarioId">
                  <PlayingScenarioContextProvider>
                    <PlayScenarioPage />
                  </PlayingScenarioContextProvider>
                </Route>
                <SceneContextProvider>
                  <ProtectedRoute
                    path="/scenario/:scenarioId"
                    component={ScenePage}
                  />
                </SceneContextProvider>
                {/* Default path if nothing matches */}
                <ProtectedRoute path="/" component={ScenarioSelectionPage} />
              </Switch>
            </BrowserRouter>
          </ScenarioContextProvider>
        </AuthenticationContextProvider>
      </ThemeProvider>
    </>
  );
}
