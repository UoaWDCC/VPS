import React, { useContext } from "react";
import { Route, Redirect } from "react-router-dom";
import AuthenticationContext from "../context/AuthenticationContext";
import LoadingPage from "../containers/pages/LoadingPage";

function ProtectedRoute({ component: Component, ...rest }) {
  const { loading, user } = useContext(AuthenticationContext);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading) {
          return <LoadingPage text="Loading contents..." />;
        }
        if (user) {
          return <Component {...props} {...rest} />;
        }
        return (
          <Redirect
            to={{
              pathname: "/login",
            }}
          />
        );
      }}
    />
  );
}

export default ProtectedRoute;
