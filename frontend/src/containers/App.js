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

export default function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <ScenarioContextProvider>
                <ScenarioSelectionPage />
              </ScenarioContextProvider>
            </Route>
            <Route path="/play/:scenarioId">
              <PlayingScenarioContextProvider>
                <PlayScenarioPage />
              </PlayingScenarioContextProvider>
            </Route>
            <Route path="/scenario/:scenarioId">
              <ScenarioContextProvider>
                <SceneContextProvider>
                  <ScenePage />
                </SceneContextProvider>
              </ScenarioContextProvider>
            </Route>
            {/* Default path if nothing matches */}
            <Route path="/">
              <ScenarioContextProvider>
                <ScenarioSelectionPage />
              </ScenarioContextProvider>
            </Route>
          </Switch>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
}
