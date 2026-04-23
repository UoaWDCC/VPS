import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import AuthenticationContext from "../../context/AuthenticationContext";

export default function TopNavBar({ activeTab = "create" }) {
  const history = useHistory();
  const { signOut } = useContext(AuthenticationContext);

  function goBack() {
    history.push("/");
  }

  const handleLogout = async () => {
    try {
      await signOut(); // This calls the signOut function from your context
      // The auth state change will automatically handle the redirect via your ProtectedRoute
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="top-nav-bar">
      <div className="nav-left">
        <button className="back-btn" onClick={goBack}>
          <ArrowLeftIcon size={20} />
          Back
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          <svg
            className="logout-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
            />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      <div className="nav-center">
        <button
          className={`nav-btn ${activeTab === "play" ? "nav-btn-active" : ""}`}
          onClick={() => history.push("/play")}
        >
          Play
        </button>
        <button
          className={`nav-btn ${activeTab === "dashboard" ? "nav-btn-active" : ""}`}
          onClick={() => history.push("/dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === "create" ? "nav-btn-active" : ""}`}
          onClick={() => history.push("/create")}
        >
          Create & Edit
        </button>
      </div>

      {/* Logout button should be in nav-right */}
      <div className="nav-right"></div>
    </div>
  );
}
