import React from "react";
import { signInWithRedirect } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import AuthenticationContext from "./AuthenticationContext";
import { auth, googleProvider } from "../firebase/firebase";

export default function AuthenticationContextProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);

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

  function signInUsingGoogle() {
    signInWithRedirect(auth, googleProvider);
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
        signInUsingGoogle,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
