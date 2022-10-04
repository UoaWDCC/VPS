import React, { useContext } from "react";
import { Route, Redirect } from "react-router-dom";
import AuthenticationContext from "../context/AuthenticationContext";
import LoadingPage from "../containers/pages/LoadingPage";

/**
 * The wrapper for all protected routes
 * This component will render the wrapped children component with logic determining
 * whether or not the user is logged in:
 * - If not logged in then redirect to login page
 * - if login status is loading then show loading page
 * - if logged in then show children components
 */
function ProtectedRoute({ children, accessLevelReq = "user", ...rest }) {
  const { loading, user, VpsUser } = useContext(AuthenticationContext);

  return (
    <Route
      {...rest}
      render={() => {
        if (loading) {
          return <LoadingPage text="Loading contents..." />;
        }
        if (user) {
          if (VpsUser.role === accessLevelReq || accessLevelReq === "user") {
            return children;
          }

          return (
            <>
              <p>Access Denied!</p>
            </>
          );
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
