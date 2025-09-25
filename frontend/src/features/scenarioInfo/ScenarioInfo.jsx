import { useState, useEffect, useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
import "./scenarioInfo.css";
import DiamondPlayButton from "./components/DiamondPlayButton";
import GradientLine from "./components/GradientLine";
import Thumbnail from "../authoring/components/Thumbnail";
import ScenarioContext from "../../context/ScenarioContext";

function ScenarioInfo() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const history = useHistory();
  const location = useLocation();
  const scenarioContext = useContext(ScenarioContext);

  const scenarios = scenarioContext?.scenarios || [];
  const username = "Admin";

  // Get scenario ID from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const scenarioId = searchParams.get("id");

    if (scenarioId && scenarios.length > 0) {
      const scenario = scenarios.find((s) => s._id === scenarioId);
      if (scenario) {
        setSelectedScenario(scenario);
      }
    }
  }, [location.search, scenarios]);

  const filteredScenarios = scenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    history.replace(`/scenario-info?id=${scenario._id}`);
  };

  const handlePlayScenario = (scenario) => {
    console.log("Starting scenario:", scenario.name);
  };

  const handleBackToPlay = () => {
    history.push("/play");
  };

  return (
    <div className="app-container" data-theme="dark">
      {/* Back Button */}
      <button
        className="back-button absolute bg-transparent border-none text-gray-500 cursor-pointer hover:text-white transition-colors"
        onClick={
          selectedScenario ? () => setSelectedScenario(null) : handleBackToPlay
        }
      >
        ← Back
      </button>

      {/* Sidebar */}
      <div className="sidebar flex flex-col">
        {/* Spacer to push content down */}
        <div className="sidebar-spacer"></div>

        {/* Search Container - Positioned above the list */}
        <div className="search-container">
          <label className="search-input-wrapper flex items-center">
            <svg
              className="search-icon"
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
              className="search-input flex-1"
              required
            />
          </label>
        </div>

        {/* Scenario List */}
        <div className="scenario-list">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario._id}
              className={`scenario-item ${scenario._id === selectedScenario?._id ? "selected" : ""}`}
              onClick={() => handleScenarioSelect(scenario)}
            >
              {scenario.name}
            </div>
          ))}
        </div>
      </div>

      {/* Gradient Line */}
      <div className="gradient-line-container">
        <GradientLine />
      </div>

      {/* Main Content */}
      <div className="main-content flex-1 flex items-center justify-center">
        {selectedScenario ? (
          <div className="scenario-detail w-full h-full flex flex-col overflow-y-auto">
            {/* Scenario Header */}
            <div className="scenario-header text-left">
              <h1 className="scenario-title text-white font-light">
                {selectedScenario.name}
              </h1>

              {/* Scenario Meta */}
              <div className="scenario-meta flex justify-start">
                <div className="meta-item flex flex-col items-start">
                  <span className="meta-label text-white/60">Created By</span>
                  <span className="meta-value text-white">{username}</span>
                </div>
                <div className="meta-item flex flex-col items-start">
                  <span className="meta-label text-white/60">Mode</span>
                  <span className="meta-value text-white">Multiplayer</span>
                </div>
                <div className="meta-item flex flex-col items-start">
                  <span className="meta-label text-white/60">Time Limit</span>
                  <span className="meta-value text-white">--</span>
                </div>
              </div>
            </div>

            {/* Scenario Content */}
            <div className="scenario-content flex-1 flex flex-col items-start">
              {/* Scenario Thumbnail */}
              <div className="scenario-thumbnail-wrapper w-full">
                <div className="scenario-thumbnail border border-gray-600 bg-white rounded-lg overflow-hidden">
                  <Thumbnail
                    components={selectedScenario.thumbnail?.components || []}
                  />
                </div>
              </div>

              {/* Scenario Description */}
              <div className="scenario-description">
                <h3 className="description-title text-white font-medium text-left">
                  Description
                </h3>
                <div className="description-content flex items-center">
                  <p className="description-text text-white/80 text-left leading-relaxed flex-1">
                    Testing scenario - This is a sample scenario for testing the
                    VPS application functionality.
                  </p>

                  <div className="play-button-wrapper flex-shrink-0">
                    <DiamondPlayButton
                      size={80}
                      onClick={() => handlePlayScenario(selectedScenario)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="welcome-message text-center text-white/60">
            <h2 className="welcome-title text-white/80 font-medium">
              Select a scenario to get started
            </h2>
            <p className="welcome-text text-white/60">
              Choose from the medical scenarios on the left to view details and
              begin training.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScenarioInfo;
