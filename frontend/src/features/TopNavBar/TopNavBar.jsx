import React from "react";
import { useHistory } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

export default function TopNavBar({
  onLogout,
  onOpenDashboard,
  onCreate, // new prop for creating
  activeTab = "create",
}) {
  const history = useHistory();

  function goBack() {
    history.push("/");
  }

  return (
    <div className="top-nav-bar">
      <div className="nav-left">
        <button className="back-btn" onClick={goBack}>
          <ArrowLeftIcon size={20} />
          Back
        </button>
        <button className="logout-btn" onClick={onLogout}>
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
