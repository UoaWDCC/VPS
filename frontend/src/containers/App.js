import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import ScenarioSelectionPage from "./pages/ScenarioSelectionPage";

import "normalize.css";
import "../styling/style.scss";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={ScenarioSelectionPage} />

          {/* Default path if nothing matches */}
          <Route path="/" component={ScenarioSelectionPage} />
        </Switch>
      </BrowserRouter>
    </>
  );
}
