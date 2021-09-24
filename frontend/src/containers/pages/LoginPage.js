import React, { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import LoadingPage from "./LoadingPage";

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