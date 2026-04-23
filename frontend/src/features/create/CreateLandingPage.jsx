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

  useEffect(() => {
    reFetch();
  }, []);

  const filteredScenarios = (userScenarios || []).filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
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
    history.push("/dashboard");
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
      {/* Edit Section */}
      <div className="section-block">
        <h2 className="section-header">Create & Edit</h2>

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
          <div className="scenario-card create-card" onClick={handleCreate}>
            <div className="scenario-card-thumbnail create-thumbnail">
              <span className="create-plus">+</span>
            </div>
          </div>
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
    </div>
  );
}
