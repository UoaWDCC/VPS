import React, { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import LoadingPage from "./LoadingPage";

/**
 * Container for the login page. Redirects logged-in users to main page and allows users to sign up using Google.
 *
 * @container
 */
export default function LoginPage() {
  const { user, loading, signInUsingGoogle } = useContext(
    AuthenticationContext
  );
  const history = useHistory();

  useEffect(() => {
    if (user) {
      history.push("/");
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      signInUsingGoogle();
    }
  }, [loading]);

  return <LoadingPage text="Redirecting..." />;
}
