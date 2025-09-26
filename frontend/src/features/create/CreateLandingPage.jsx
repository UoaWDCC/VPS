import { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import MenuItem from "@material-ui/core/MenuItem";
import ContextMenu from "../../components/ContextMenu";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import AccessLevel from "../../enums/route.access.level";
import { useDelete, usePost } from "../../hooks/crudHooks"; 
import HorizontalGradientLine from "../create/components/HorizontalGradientLine";
import Thumbnail from "../authoring/components/Thumbnail";
import CreateScenarioCard from "../../components/CreateScenarioCard/CreateScenarioCard"; 
import "../playScenario/PlayLandingPage.css"; 
import "./CreateLandingPage.css"; 

export default function CreateLandingPage() {
  const {
    scenarios: userScenarios,
    reFetch,
    currentScenario,
    setCurrentScenario,
  } = useContext(ScenarioContext);
  const { getUserIdToken, VpsUser } = useContext(AuthenticationContext);
  const history = useHistory();

  const [search, setSearch] = useState("");
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectingForDashboard, setSelectingForDashboard] = useState(false);

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

  const openDashboard = () => {
     setSelectingForDashboard(true);
  };

  return (
    <div className="play-container" data-theme="dark">
      {/* Top Nav */}
      <div className="top-nav-bar">
        <div className="nav-left">
          <button className="logout-btn" onClick={() => history.push("/")}>
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
          <button className="nav-btn" onClick={() => history.push("/play")}>
            Play
          </button>
          <button className="nav-btn nav-btn-active">Create & Edit</button>
          <button className="nav-btn" onClick={openDashboard}>
            Dashboard
          </button>
        </div>
      </div>

      {/* Create Section */}
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
              className={`scenario-card ${
                selectingForDashboard ? "selectable-card" : ""
              }`}
              onClick={() => {
                if (selectingForDashboard) {
                  history.push(`/dashboard/${currentScenario._id}`);
                  setSelectingForDashboard(false);
                } else {
                  history.push(`/scenario/${scenario._id}`);
                }
              }}
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
          <MenuItem onClick={openDashboard} disabled={!currentScenario}>
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

      {/* Dashboard Selection Message */}
      {selectingForDashboard && (
        <div className="dashboard-selection-message">
          Select a scenario to open the Dashboard
        </div>
      )}
    </div>
  );
}
