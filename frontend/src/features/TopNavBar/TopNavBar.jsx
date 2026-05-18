import React, { useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import { LogOutIcon } from "lucide-react";

export default function TopNavBar() {
  const { signOut } = useContext(AuthenticationContext);

  const history = useHistory();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(); // This calls the signOut function from your context
      // The auth state change will automatically handle the redirect via your ProtectedRoute
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-base-100 pl-xl pr-[calc(var(--spacing-xl)+7.5rem)] flex border-b-1 font-dm border-gradient z-1">
      <div className="py-m w-30 -mb-[1px]">
        <button onClick={handleLogout} className="btn btn-phantom text-m">
          <LogOutIcon size={20} />
          <span>Logout</span>
        </button>
      </div>
      <div className="flex mx-auto items-center gap-2xl pt-xl -mb-[1px]">
        <button
          className={`btn btn-phantom px-10 pb-3 border-0 border-b-4 border-transparent rounded-none border-solid! text-m ${pathname === "/play" ? "text-secondary! border-secondary!" : ""}`}
          onClick={() => history.push("/play")}
        >
          Play
        </button>
        <button
          className={`btn btn-phantom px-10 pb-3 border-0 border-b-4 border-transparent rounded-none border-solid! text-m ${pathname === "/dashboard" ? "text-secondary! border-secondary!" : ""}`}
          onClick={() => history.push("/dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`btn btn-phantom px-10 pb-3 border-0 border-b-4 border-transparent rounded-none border-solid! text-m ${pathname === "/create" ? "text-secondary! border-secondary!" : ""}`}
          onClick={() => history.push("/create")}
        >
          Create & Edit
        </button>
      </div>
    </div>
  );
}
