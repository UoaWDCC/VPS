import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider } from "../firebase/firebase";
import { useGetSimplified } from "../hooks/crudHooks";
import AuthenticationContext from "./AuthenticationContext";
import toast from "react-hot-toast";

export default function AuthenticationContextProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function getUserIdToken() {
    if (user) {
      try {
        const token = await user.getIdToken(false);
        return token;
      } catch (error) {
        console.error("Failed to get ID token:", error);
        try {
          const refreshedToken = await user.getIdToken(true);
          return refreshedToken;
        } catch (refreshError) {
          console.error("Failed to refresh ID token:", refreshError);
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

  const [userRole, setUserRole] = useState();
  const userID = user == null ? "null" : user.uid; // this is to avoid null pointer exceptions while confining to hook rules
  useGetSimplified(`/api/staff/${userID}`, setUserRole);

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
