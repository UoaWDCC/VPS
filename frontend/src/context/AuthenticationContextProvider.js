import React from "react";
import { signInWithRedirect } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import AuthenticationContext from "./AuthenticationContext";
import { auth, googleProvider } from "../firebase/firebase";

/**
 * This is a Context Provider made with the React Context API
 * AuthenticationContext grants access to functions and variables related to Firebase login
 */
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

  /**
   * This function determines the role of the current logged in user.
   * ATM, the function is hard-coded. TODO: Check user details is in mongodb
   * @returns the role of user
   */
  function getRole(userID) {
    const testAdminList = ["lia"];

    if (testAdminList.includes(userID)) {
      return "admin";
    }

    return "user";
  }

  // creating user object with role property
  const VpsUser = {
    firebaseUserObj: user,
    role: getRole("lia"),
  };

  return (
    <AuthenticationContext.Provider
      value={{
        getUserIdToken,
        loading,
        user,
        error,
        signOut,
        signInUsingGoogle,
        VpsUser,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
