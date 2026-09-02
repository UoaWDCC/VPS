import { useContext } from "react";
import { Redirect, Route } from "react-router-dom";
import LoadingPage from "../features/status/LoadingPage";
import AuthenticationContext from "../context/AuthenticationContext";

/**
 * The wrapper for all protected routes
 * This component will render the wrapped children component with logic determining
 * whether or not the user is logged in:
 * - If not logged in then redirect to login page
 * - if login status is loading then show loading page
 * - if logged in then show children components
 */
function ProtectedRoute({ children, ...rest }) {
  const { loading, user } = useContext(AuthenticationContext);

  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (loading) {
          return <LoadingPage text="Loading contents..." />;
        }
        if (user) {
          return children;
        }

        const redirectPath =
          location.pathname !== "/"
            ? `?redirect=${location.pathname}${location.search}`
            : "";

        return (
          <Redirect
            to={{
              pathname: "/login",
              search: redirectPath,
            }}
          />
        );
      }}
    />
  );
}

export default ProtectedRoute;
