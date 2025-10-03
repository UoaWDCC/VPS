import { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import MenuItem from "@material-ui/core/MenuItem";
import ContextMenu from "../../components/ContextMenu";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import AccessLevel from "../../enums/route.access.level";
import { useDelete } from "../../hooks/crudHooks";
import HorizontalGradientLine from "./components/HorizontalGradientLine";
import Thumbnail from "../authoring/components/Thumbnail";
import "./PlayLandingPage.css";

export default function PlayLandingPage() {
  const {
    scenarios: userScenarios,
    reFetch,
    assignedScenarios,
    reFetch2,
    currentScenario,
    setCurrentScenario,
  } = useContext(ScenarioContext);
  const { user, getUserIdToken, VpsUser, signOut } = useContext(AuthenticationContext); // Added signOut
  const history = useHistory();

  const [search, setSearch] = useState("");
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");

  useEffect(() => {
    reFetch();
    reFetch2();
  }, []);

  const allScenarios = [
    ...(userScenarios || []),
    ...(assignedScenarios || []).filter(
      (as) => !userScenarios.some((us) => us._id === as._id)
    ),
  ];

  const filteredScenarios = allScenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDashboardScenarios = allScenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(dashboardSearch.toLowerCase())
  );

  const handleContextMenu = (event, scenario) => {
    event.preventDefault();
    setCurrentScenario(scenario);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  };

  const openDashboardModal = () => {
    setShowDashboardModal(true);
    setDashboardSearch("");
  };

  const selectDashboardScenario = (scenario) => {
    setCurrentScenario(scenario);
    history.push(`/dashboard/${scenario._id}`);
    setShowDashboardModal(false);
  };

  const deleteScenario = async () => {
    await useDelete(`/api/scenario/${currentScenario._id}`, getUserIdToken);
    setCurrentScenario(null);
    reFetch();
    reFetch2();
  };

  const playScenario = () => {
    if (currentScenario) {
      history.push(`/scenario-info?id=${currentScenario._id}`);
    }
  };

  const editScenario = () => {
    if (currentScenario) {
      history.push(`/scenario/${currentScenario._id}`);
    }
  };

  const handleCreate = () => {
    history.push("/create");
  };

  const handleScenarioPlay = (scenario) => {
    history.push(`/scenario-info?id=${scenario._id}`);
  };

  // Add this logout function
  const handleLogout = async () => {
    try {
      await signOut(); // This calls the signOut function from your context
      // The auth state change will automatically handle the redirect via your ProtectedRoute
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="play-container" data-theme="dark">
      {/* Top Navigation Bar */}
      <div className="top-nav-bar">
        <div className="nav-left">
          {/* Update the logout button to use handleLogout */}
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
        <div className="nav-right">
          <button className="nav-btn nav-btn-active">Play</button>
          <button className="nav-btn" onClick={handleCreate}>
            Create & Edit 
          </button>
          <button className="nav-btn" onClick={openDashboardModal}>
            Dashboard
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="play-header">
        <h1 className="play-title">Play</h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container-play">
          <label className="search-input-wrapper-play">
            <svg
              className="search-icon-play"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input
              type="search"
              placeholder="Search scenario"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-play"
              required
            />
          </label>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        position={contextMenuPosition}
        setPosition={setContextMenuPosition}
      >
        <MenuItem onClick={playScenario} disabled={!currentScenario}>
          Play
        </MenuItem>
        <MenuItem onClick={editScenario} disabled={!currentScenario}>
          Edit
        </MenuItem>
        <MenuItem onClick={deleteScenario} disabled={!currentScenario}>
          Delete
        </MenuItem>
        {VpsUser?.role === AccessLevel.STAFF && (
          <MenuItem onClick={openDashboardModal} disabled={!currentScenario}>
            Dashboard
          </MenuItem>
        )}
      </ContextMenu>

      {/* Scenarios Grid */}
      <div className="scenarios-grid">
        {filteredScenarios.map((scenario) => (
          <div
            key={scenario._id}
            className="scenario-card"
            onClick={() => handleScenarioPlay(scenario)}
            onContextMenu={(e) => handleContextMenu(e, scenario)}
          >
            <div className="scenario-card-thumbnail">
              <Thumbnail components={scenario.thumbnail?.components || []} />
            </div>
            <div className="scenario-card-name">
              <p className="scenario-name-text">{scenario.name}</p>
            </div>
          </div>
        ))}
      </div>

     {showDashboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black-800 p-8 rounded-lg max-w-7xl w-full h-4/5 overflow-y-auto relative animate-slide-up">
            <button
              className="btn btn-sm btn-square absolute right-2 top-2 text-white"
              onClick={() => setShowDashboardModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font mb-4 text-white">Select Scenario for Dashboard</h2>
            <div className="search-section mb-4">
              <div className="search-container-play">
                <label className="search-input-wrapper-play">
                  <svg
                    className="search-icon-play"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.3-4.3"></path>
                    </g>
                  </svg>
                  <input
                    type="search"
                    placeholder="Search scenario"
                    value={dashboardSearch}
                    onChange={(e) => setDashboardSearch(e.target.value)}
                    className="search-input-play"
                    required
                  />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredDashboardScenarios.map((scenario) => (
                <div
                  key={scenario._id}
                  className="card bg-black-700 shadow-xl cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => selectDashboardScenario(scenario)}
                >
                  <div className="card-body">
                    <Thumbnail components={scenario.thumbnail?.components || []} />
                    <h3 className="card-title text-white">{scenario.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}