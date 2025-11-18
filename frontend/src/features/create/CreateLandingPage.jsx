import { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import MenuItem from "@material-ui/core/MenuItem";
import ContextMenu from "../../components/ContextMenu";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import AccessLevel from "../../enums/route.access.level";
import { useDelete, usePost } from "../../hooks/crudHooks";
import Thumbnail from "../authoring/components/Thumbnail";
import CreateScenarioCard from "../../components/CreateScenarioCard/CreateScenarioCard";
import TopNavBar from "../../features/TopNavBar/TopNavBar";
import "../playScenario/PlayLandingPage.css";
import "./CreateLandingPage.css";

export default function CreateLandingPage() {
  const {
    scenarios: userScenarios,
    reFetch,
    currentScenario,
    setCurrentScenario,
  } = useContext(ScenarioContext);
  const { getUserIdToken, VpsUser, signOut } = useContext(
    AuthenticationContext
  );
  const history = useHistory();

  const [search, setSearch] = useState("");
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");

  useEffect(() => {
    reFetch();
  }, []);

  const filteredScenarios = (userScenarios || []).filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDashboardScenarios = (userScenarios || []).filter((scenario) =>
    scenario.name.toLowerCase().includes(dashboardSearch.toLowerCase())
  );

  const handleContextMenu = (event, scenario) => {
    event.preventDefault();
    setCurrentScenario(scenario);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  };

  const deleteScenario = async () => {
    await useDelete(`/api/scenario/${currentScenario._id}`, getUserIdToken);
    setCurrentScenario(null);
    reFetch();
  };

  const handleCreate = () => setShowCreateModal(true);

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

  const openDashboardModal = () => {
    setShowDashboardModal(true);
    setDashboardSearch(""); // Reset search in modal
  };

  const selectDashboardScenario = (scenario) => {
    setCurrentScenario(scenario); // Set the current scenario in the context
    history.push(`/dashboard/${scenario._id}`);
    setShowDashboardModal(false);
  };

  // Add the logout function
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="play-container" data-theme="dark">
      {/* Top Nav - Using extracted component */}
      <TopNavBar
        onLogout={handleLogout}
        onOpenDashboard={openDashboardModal}
        activeTab="create"
      />

      {/* Rest of your component remains the same */}
      <div className="section-block">
        <h2 className="section-header">Create</h2>
        <div className="scenarios-grid">
          <div className="scenario-card create-card" onClick={handleCreate}>
            <div className="scenario-card-thumbnail create-thumbnail">
              <span className="create-plus">+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Section */}
      <div className="section-block">
        <h2 className="section-header">Edit</h2>

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

        <div className="scenarios-grid">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario._id}
              className="scenario-card"
              onClick={() => history.push(`/scenario/${scenario._id}`)}
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

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <CreateScenarioCard
          className="create-scenario-card"
          onCreate={async (name) => {
            const newScenario = await usePost(
              `/api/scenario`,
              { name },
              getUserIdToken
            );
            await usePost(
              `/api/scenario/${newScenario._id}/scene`,
              { name: "Scene 1" },
              getUserIdToken
            );
            setCurrentScenario(newScenario);
            history.push(`/scenario/${newScenario._id}`);
            reFetch();
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Dashboard Modal */}
      {showDashboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black-800 p-8 rounded-lg max-w-7xl w-full h-4/5 overflow-y-auto relative animate-slide-up">
            <button
              className="btn btn-sm btn-square absolute right-2 top-2 text-white"
              onClick={() => setShowDashboardModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font mb-4 text-white">
              Select Scenario for Dashboard
            </h2>
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
            <div className="scenarios-grid">
              {filteredDashboardScenarios.map((scenario) => (
                <div
                  key={scenario._id}
                  className="scenario-card"
                  onClick={() => selectDashboardScenario(scenario)}
                >
                  <div className="scenario-card-thumbnail">
                    <Thumbnail
                      components={scenario.thumbnail?.components || []}
                    />
                  </div>
                  <div className="scenario-card-name">
                    <h3 className="scenario-name-text">{scenario.name}</h3>
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
