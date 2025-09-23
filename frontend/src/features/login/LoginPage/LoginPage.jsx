import { useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import AuthenticationContext from "context/AuthenticationContext";

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

export default function LoginPage() {
  const { user, loading, signInUsingGoogle, signOut } =
    useContext(AuthenticationContext);
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
    <div className="min-h-screen flex flex-col">
      {/* Top whitespace */}
      <div style={{ height: "var(--spacing-2xl-3xl)" }} />

      {/* Main container */}
      <div
        className="u-container u-grid flex-grow w-full"
      >
        {/* Grid container for left/right split */}
        <div
          className="u-grid w-full flex-grow"
          style={{ gridTemplateColumns: "636fr 304fr", height: "100%" }}
        >
          {/* Left container */}
          <div className="flex flex-col justify-between h-full">
            {/* Top-left text */}
            <div 
            className="text-left font-ibm" 
            style={{ 
              fontSize: "clamp(92px, 5vw, 105px)", 
              lineHeight: "clamp(102px, 5.5vw, 115px)" 
            }}
            >
              <div>Virtual</div>
              <div>Patient</div>
              <div>Simulator</div>
            </div>

            {/* Bottom-left text */}
            <div className="text-left font-ibm text-s" style={{ color: "var(--color-grey)" }}>
              <div>Crafted by many hands,</div>
              <div>across many teams,</div>
              <div>
                over many years at{" "}
                <a
                  className="underline decoration-1 underline-offset-2 hover:text-white"
                  href="https://wdcc.co.nz/"
                  target="_blank"
                  rel="noreferrer"
                >
                  WDCC
                </a>
                .
              </div>
            </div>
          </div>

          {/* Right container */}
          <div className="flex flex-col justify-between h-full">
            {/* Centered diamond button */}
            <div className="flex-grow flex justify-center items-center">
            <button
              className="btn vps-diamond"
              onClick={() => {
                if (!loading && !user) {
                  signInUsingGoogle();
                }
              }}
            >
              <span>LOG IN</span>
            </button>
            </div>

            {/* Bottom-aligned text */}
            <div className="font-ibm text-s text-center">Please use your university account.</div>
          </div>
        </div>
      </div>

      {/* Bottom whitespace */}
      <div style={{ height: "var(--spacing-3xl-4xl)" }} />
    </div>
  );
}

