import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import ScenarioSelectionPage from "./pages/ScenarioSelectionPage";
import PlayScenarioPage from "./pages/PlayScenarioPage/PlayScenarioPage";
import { ScenePage } from "./pages/SceneSelectionPage";
import ScenarioContextProvider from "../context/ScenarioContextProvider";
import SceneContextProvider from "../context/SceneContextProvider";
import PlayingScenarioContextProvider from "../context/PlayScenarioContextProvider";
import "normalize.css";
import "../styling/style.scss";

export default function App() {
  return (
    <>
      <ScenarioContextProvider>
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={ScenarioSelectionPage} />
            <Route path="/play/:scenarioId">
              <PlayingScenarioContextProvider>
                <PlayScenarioPage />
              </PlayingScenarioContextProvider>
            </Route>
            <Route path="/scenario/:scenarioId">
              <SceneContextProvider>
                <ScenePage />
              </SceneContextProvider>
            </Route>
            {/* Default path if nothing matches */}
            <Route path="/" component={ScenarioSelectionPage} />
          </Switch>
        </BrowserRouter>
      </ScenarioContextProvider>
    </>
  );
}
