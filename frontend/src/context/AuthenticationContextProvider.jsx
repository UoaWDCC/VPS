import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider } from "../firebase/firebase";
import AuthenticationContext from "./AuthenticationContext";
import toast from "react-hot-toast";

/**
 * This is a Context Provider made with the React Context API
 * AuthenticationContext grants access to functions and variables related to Firebase login
 */
export default function AuthenticationContextProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);
  const [isSigningIn, setIsSigningIn] = useState(false); // Whether or not the user is currently in the signin popup.

  /**
   * No idToken is stored in state to ensure the non-expired idToken is always used
   * @returns idToken or null if user is not signed in
   */
  async function getUserIdToken() {
    if (user) {
      try {
        // Try to get token without forcing refresh
        const token = await user.getIdToken(false);
        return token;
      } catch (error) {
        console.error("Failed to get ID token:", error);
        // Try to refresh the token if getting it failed
        try {
          const refreshedToken = await user.getIdToken(true);
          return refreshedToken;
        } catch (refreshError) {
          console.error("Failed to refresh ID token:", refreshError);
          // Last resort -> try signing out and redirecting to login
          try {
            await auth.signOut();
          } catch (signOutError) {
            console.error("Failed to sign out:", signOutError);
          }
          return null;
        }
      }
    }

    return null;
  }

  function signInUsingGoogle() {
    setIsSigningIn(true);
    signInWithPopup(auth, googleProvider)
      .catch(() => toast.error("Failed to log in."))
      .finally(() => setIsSigningIn(false));
  }

  function signOut() {
    auth.signOut();
  }

  return (
    <AuthenticationContext.Provider
      value={{
        getUserIdToken,
        isSigningIn,
        loading,
        user,
        error,
        signOut,
        signInUsingGoogle,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
