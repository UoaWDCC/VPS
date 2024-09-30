import { useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import AuthenticationContext from "context/AuthenticationContext";
import LoadingPage from "features/status/LoadingPage";
import styles from "./LoginPage.module.scss";
import GoogleIcon from "./GoogleIcon";

import toast from "react-hot-toast";
import axios from "axios";

const handleSignIn = async (user) => {
  const token = await user.getIdToken();
  const config = {
    method: "post",
    url: `api/user/`,
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: user.displayName,
      uid: user.uid,
      email: user.email,
      pictureURL: user.photoURL,
    },
  };
  return axios.request(config);
};

/**
 * Container for the login page. Redirects logged-in users to main page and allows users to sign up using Google.
 *
 * @container
 */
export default function LoginPage() {
  const { user, loading, isSigningIn, signInUsingGoogle, signOut } = useContext(
    AuthenticationContext
  );
  const history = useHistory();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const redirectPath = params.get("redirect") || "/";

  useEffect(() => {
    if (!user) return;

    handleSignIn(user)
      .then(() => history.push(redirectPath))
      .catch((e) => {
        if (e.response?.status === 403) {
          toast.error("Please sign in with your UoA account");
          signOut();
        } else {
          console.log(e);
          toast.error("An unexpected error occurred while signing in");
        }
      });
  }, [user]);

  return (
    <div className="w-full h-full flex flex-col items-center p-10 graph-paper">
      {/* Main title + subtitle */}
      <div className="flex flex-col justify-end items-center basis-[60%] gap-5 text-center font-mona">
        <h1 className={`font-semibold text-6xl text-uoa-blue`}>
          Virtual Patient Simulator
        </h1>
        <p className="text-slate-600 max-w-[65rem]">
          This tool aims to provide Medical and Health Science students at the
          University of Auckland with a tool that supports interactive and
          immersive education through virtual patient scenarios.
        </p>

        <button
          className="btn btn-outline mt-16 cursor-pointer"
          disabled={loading || isSigningIn}
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
        <p className="font-light font-mona text-xs text-slate-400">
          Make sure to use your <b>university account</b>.
        </p>
      </div>

      {/* credits */}
      <div className="w-full font-mona font-light text-xs tracking-wider text-slate-400 flex-grow flex justify-center items-end text-center">
        <p>
          Crafted by many hands, across many teams, over many years at{" "}
          <a
            className={`font-bold ${styles.gradient} `}
            href="https://wdcc.co.nz/"
            target="_blank"
          >
            WDCC
          </a>
          .
        </p>
      </div>

      {/* Hidden on small screens. UoA is not *that* important in this... */}
      <a href="https://www.auckland.ac.nz" target="_blank">
        <img
          draggable="false"
          src="uoa-logo-filled.png"
          alt="University of Auckland Logo"
          className="w-10 right-7 bottom-7 fixed md:block hidden"
        />
      </a>
    </div>
  );
}
