import { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import { usePost } from "../../hooks/crudHooks";
import LoadingPage from "./LoadingPage";

/**
 * Container for the login page. Redirects logged-in users to main page and allows users to sign up using Google.
 *
 * @container
 */
export default function LoginPage() {
  const { user, loading, signInUsingGoogle, getUserIdToken } = useContext(
    AuthenticationContext
  );
  const history = useHistory();

  useEffect(() => {
    if (user) {
      usePost(
        `/api/user`,
        {
          name: user.displayName,
          uid: user.uid,
          email: user.email,
          pictureURL: user.photoURL,
        },
        getUserIdToken
      );
      history.push("/");
    }
  }, [user]);

  // useEffect(() => {
  //   if (!loading && !user) {
  //     signInUsingGoogle();
  //   }
  // }, [loading]);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!loading && !user) {
            signInUsingGoogle();
          } else {
            <LoadingPage text="logging in..." />;
          }
        }}
      >
        WIP Login
      </button>
    </div>
  );
}
