import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import IndexPage from "./pages/IndexPage";

import "normalize.css";
import "../styling/style.scss";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={IndexPage} />

          {/* Default path if nothing matches */}
          <Route path="/" component={IndexPage} />
        </Switch>
      </BrowserRouter>
    </>
  );
}
