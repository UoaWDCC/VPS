import { signInWithRedirect, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider } from "../firebase/firebase";
import { useGetSimplified } from "../hooks/crudHooks";
import AuthenticationContext from "./AuthenticationContext";

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
    signInWithPopup(auth, googleProvider);
    // signInWithRedirect(auth, googleProvider);
  }

  function signOut() {
    auth.signOut();
  }

  // getting role from backend
  const [userRole, setUserRole] = useState();
  const userID = user == null ? "null" : user.uid; // this is to avoid null pointer exceptions while confining to hook rules
  useGetSimplified(`/api/staff/${userID}`, setUserRole);

  // creating user object with role property
  const VpsUser = {
    firebaseUserObj: user,
    role: userRole,
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
