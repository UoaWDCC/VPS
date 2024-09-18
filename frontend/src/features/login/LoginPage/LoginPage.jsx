import { useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import ScreenContainer from "components/ScreenContainer/ScreenContainer";
import AuthenticationContext from "context/AuthenticationContext";
import { usePost } from "hooks/crudHooks";
import LoadingPage from "features/status/LoadingPage";
import styles from "./LoginPage.module.scss";
import sideBarStyles from "components/SideBar/SideBar.module.scss";
import GoogleIcon from "./GoogleIcon";
import toast from "react-hot-toast";

/**
 * Container for the login page. Redirects logged-in users to main page and allows users to sign up using Google.
 *
 * @container
 */
export default function LoginPage() {
  const { user, loading, isSigningIn, signInUsingGoogle, getUserIdToken } =
    useContext(AuthenticationContext);
  const history = useHistory();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const redirectPath = params.get("redirect") || "/";

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
      history.push(redirectPath);
    }
  }, [user]);

  return (
    <div className="w-full h-full flex flex-col items-center p-10 graph-paper">
      {/* Main title + subtitle */}
      <div className="flex flex-col justify-end items-center basis-[70%] gap-3 text-center font-mona">
        <h1 className={`font-semibold text-6xl ${styles.gradient}`}>
          Virtual Patient Simulator
        </h1>
        <p className="text-slate-600 max-w-[75rem]">
          This tool aims to provide Medical and Health Science students at the
          University of Auckland with a tool that supports interactive and
          immersive education through virtual patient scenarios.
        </p>

        <button
          className="btn btn-outline mt-16 cursor-pointer"
          onClick={() => {
            if (!loading && !user) {
              signInUsingGoogle();
            } else {
              <LoadingPage text="logging in..." />;
            }
          }}
        >
          {loading || isSigningIn ? (
            <>
              <span className="loading loading-spinner"></span> Check the popup!
            </>
          ) : (
            <>
              <GoogleIcon /> Sign In with Google
            </>
          )}
        </button>
      </div>

      {/* credits */}
      <div className="font-mona font-light text-xs tracking-wider text-slate-400 flex-grow flex justify-center items-end ">
        <p>
          Crafted by many hands, across many teams, over many years at{" "}
          <a
            className={`font-bold ${styles.gradient} `}
            href="https://wdcc.co.nz/"
          >
            WDCC
          </a>
          !
        </p>
      </div>
    </div>
  );
}
