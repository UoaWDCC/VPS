import { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import "./playPage.css";
import HorizontalGradientLine from "./components/HorizontalGradientLine";
import Thumbnail from "../authoring/components/Thumbnail";
import ScenarioContext from "../../context/ScenarioContext";
import FabMenu from "../../components/FabMenu";

function PlayPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const history = useHistory();
  const scenarioContext = useContext(ScenarioContext);

  const scenarios = scenarioContext?.scenarios || [];

  const filteredScenarios = scenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button className="nav-btn">Create</button>
        </div>
      </div>

      {/* Header */}
      <div className="play-header">
        <h1 className="play-title text-white font-light">Play</h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container-play">
          <label className="search-input-wrapper-play flex items-center">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-play flex-1"
              required
            />
          </label>
        </div>
      </div>

      {/* Gradient Line */}
      <div className="gradient-line-container-play">
        <HorizontalGradientLine />
      </div>

      {/* Scenarios Grid */}
      <div className="scenarios-grid">
        {filteredScenarios.map((scenario) => (
          <div
            key={scenario._id}
            className="scenario-card"
            onClick={() => handleScenarioPlay(scenario)}
          >
            {/* Scenario Thumbnail */}
            <div className="scenario-card-thumbnail">
              <Thumbnail components={scenario.thumbnail?.components || []} />
            </div>

            {/* Scenario Name */}
            <div className="scenario-card-name">
              <p className="scenario-name-text">{scenario.name}</p>
            </div>
          </div>
        ))}
      </div>
      <FabMenu />
    </div>
  );
}

export default PlayPage;
