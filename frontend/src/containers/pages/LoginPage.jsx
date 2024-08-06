import { useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import ScreenContainer from "components/ScreenContainer";
import AuthenticationContext from "../../context/AuthenticationContext";
import { usePost } from "../../hooks/crudHooks";
import LoadingPage from "./LoadingPage";
import styles from "../../styling/LoginPage.module.scss";
import sideBarStyles from "../../styling/SideBar.module.scss";

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

  // useEffect(() => {
  //   if (!loading && !user) {
  //     signInUsingGoogle();
  //   }
  // }, [loading]);

  return (
    <ScreenContainer>
      <div className={sideBarStyles.sideBar}>
        <img
          draggable="false"
          className={sideBarStyles.logo}
          src="uoa-logo.png"
          alt="University of Auckland Logo"
        />
        <div className={sideBarStyles.sideBarText}>
          Please login to start your simulation
        </div>
        <button
          className={sideBarStyles.googleButton}
          type="button"
          onClick={() => {
            if (!loading && !user) {
              signInUsingGoogle();
            } else {
              <LoadingPage text="logging in..." />;
            }
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.26644 9.76453C6.19903 6.93863 8.85469 4.90909 12.0002 4.90909C13.6912 4.90909 15.2184 5.50909 16.4184 6.49091L19.9093 3C17.7821 1.14545 15.0548 0 12.0002 0C7.27031 0 3.19799 2.6983 1.24023 6.65002L5.26644 9.76453Z"
              fill="#EA4335"
            />
            <path
              d="M16.0406 18.0142C14.9508 18.718 13.5659 19.0926 11.9998 19.0926C8.86633 19.0926 6.21896 17.0785 5.27682 14.2695L1.2373 17.3366C3.19263 21.2953 7.26484 24.0017 11.9998 24.0017C14.9327 24.0017 17.7352 22.959 19.834 21.0012L16.0406 18.0142Z"
              fill="#34A853"
            />
            <path
              d="M19.8342 20.9978C22.0292 18.9503 23.4545 15.9019 23.4545 11.9982C23.4545 11.2891 23.3455 10.5255 23.1818 9.81641H12V14.4528H18.4364C18.1188 16.0119 17.2663 17.2194 16.0407 18.0108L19.8342 20.9978Z"
              fill="#4A90E2"
            />
            <path
              d="M5.27698 14.2663C5.03833 13.5547 4.90909 12.7922 4.90909 11.9984C4.90909 11.2167 5.03444 10.4652 5.2662 9.76294L1.23999 6.64844C0.436587 8.25884 0 10.0738 0 11.9984C0 13.918 0.444781 15.7286 1.23746 17.3334L5.27698 14.2663Z"
              fill="#FBBC05"
            />
          </svg>
          Sign In with Google{" "}
        </button>
        <div className={sideBarStyles.sponsorText}>
          Developed by UoA and WDCC
        </div>
      </div>
      <div className={styles.login}>
        <div className={styles.header}>Virtual Patient Simulator</div>
        <div className={styles.infoBlock}>
          This tool aims to provide Medical and Health Science students at the
          University of Auckland with a tool that supports interactive and
          immersive education through virtual patient scenarios.
        </div>
      </div>
    </ScreenContainer>
  );
}
