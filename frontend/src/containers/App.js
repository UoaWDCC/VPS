import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import ScenarioSelectionPage from "./pages/ScenarioSelectionPage";
import PlayScenarioPage from "./pages/PlayingScenarioPage/PlayScenarioPage";
import { ScenePage } from "./pages/SceneSelectionPage";
import ScenarioContextProvider from "../context/ScenarioContextProvider";
import SceneContextProvider from "../context/SceneContextProvider";

import "normalize.css";
import "../styling/style.scss";

export default function App() {
  return (
    <>
      <ScenarioContextProvider>
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={ScenarioSelectionPage} />
            <Route path="/play/:scenarioId" component={PlayScenarioPage} />
            <SceneContextProvider>
              <Route path="/scenario/:scenarioId" component={ScenePage} />
            </SceneContextProvider>
            {/* Default path if nothing matches */}
            <Route path="/" component={ScenarioSelectionPage} />
          </Switch>
        </BrowserRouter>
      </ScenarioContextProvider>
    </>
  );
}
