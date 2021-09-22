import React, { useEffect } from "react";
import { signInWithRedirect } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import AuthenticationContext from "./AuthenticationContext";
import { auth, googleProvider } from "../auth/firebase";

export default function AuthenticationContextProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    // loading is true when the user refreshes the page
    if (loading) {
      return;
    }

    if (!user) {
      // user logged out, redirect to Google signin page
      signInWithRedirect(auth, googleProvider);
    }
  }, [loading, user]);

  /**
   * No idToken is stored in state to ensure the non-expired idToken is always used
   * @returns idToken or null if user is not signed in
   */
  async function getUserIdToken() {
    if (user) {
      const token = await user.getIdToken();
      return token;
    }

    return null;
  }

  function signOut() {
    auth.signOut();
  }

  return (
    <AuthenticationContext.Provider
      value={{
        getUserIdToken,
        loading,
        user,
        error,
        signOut,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
