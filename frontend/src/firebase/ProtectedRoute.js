import React, { useContext } from "react";
import { Route, Redirect } from "react-router-dom";
import AuthenticationContext from "../context/AuthenticationContext";
import LoadingPage from "../containers/pages/LoadingPage";

function ProtectedRoute({ children, ...rest }) {
  const { loading, user } = useContext(AuthenticationContext);

  return (
    <Route
      {...rest}
      render={() => {
        if (loading) {
          return <LoadingPage text="Loading contents..." />;
        }
        if (user) {
          return children;
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
