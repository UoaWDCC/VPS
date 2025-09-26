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
  const { user, getUserIdToken, VpsUser } = useContext(AuthenticationContext);
  const history = useHistory();

  const [search, setSearch] = useState("");
  const [contextMenuPosition, setContextMenuPosition] = useState(null);

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

  const handleContextMenu = (event, scenario) => {
    event.preventDefault();
    setCurrentScenario(scenario);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  };

  const openDashboard = () => {
    history.push("/dashboard");
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
    history.push("/create"); // Navigates to CreateLandingPage at /create
  };

  const handleScenarioPlay = (scenario) => {
    history.push(`/scenario-info?id=${scenario._id}`);
  };

  return (
    <div className="play-container" data-theme="dark">
      {/* Top Navigation Bar */}
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
          <button className="nav-btn nav-btn-active">Play</button>
          <button className="nav-btn" onClick={handleCreate}>
            Create & Edit 
          </button>
          <button className="nav-btn" onClick={openDashboard}>
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
          <MenuItem onClick={openDashboard} disabled={!currentScenario}>
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
    </div>
  );
}