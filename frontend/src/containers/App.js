import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import ScenarioSelectionPage from "./pages/ScenarioSelectionPage";
import SceneSelectionPage from "./pages/SceneSelectionPage";

import "normalize.css";
import "../styling/style.scss";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={ScenarioSelectionPage} />
          <Route path="/:scenarioId" component={SceneSelectionPage} />

          {/* Default path if nothing matches */}
          <Route path="/" component={ScenarioSelectionPage} />
        </Switch>
      </BrowserRouter>
    </>
  );
}
