import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider } from "../firebase/firebase";
import { useGetSimplified } from "../hooks/crudHooks";
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
      const token = await user.getIdToken();
      return token;
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
        isSigningIn,
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
