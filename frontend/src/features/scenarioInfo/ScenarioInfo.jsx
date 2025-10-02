import { useState, useEffect, useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
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
    history.push("/play-page");
  };

  return (
    <div className="bg-base-100 text-base-content flex h-screen relative" data-theme="vps-dark">
      {/* Back Button */}
      <button
        className="absolute z-50 bg-transparent border-none text-primary cursor-pointer hover:text-base-content transition-colors p-[var(--spacing-s)] top-[var(--spacing-l)] left-[var(--spacing-l)] font-[family-name:var(--font-dm)] text-[length:var(--text-s)]"
        onClick={
          selectedScenario ? () => setSelectedScenario(null) : handleBackToPlay
        }
      >
        ← Back
      </button>

      {/* Sidebar */}
      <div className="w-[27%] bg-base-100 flex flex-col relative h-screen">
        {/* Spacer to push content down */}
        <div className="h-[35vh] flex-shrink-0"></div>

        {/* Search Container - Positioned above the list */}
        <div className="bg-transparent p-[2vh_2.5%] absolute top-[20vh] left-0 right-0 z-10 flex-shrink-0">
          <label className="bg-transparent gap-[1vw] pl-[2vw] flex items-center flex-row-reverse">
                        <svg
              className="h-[var(--text-m)] w-[var(--text-m)] opacity-50 flex-shrink-0 stroke-current"
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
              className="flex-1 bg-transparent border-none outline-none text-base-content text-[length:var(--text-s)] placeholder:text-primary/60 font-[family-name:var(--font-ibm)]"
              required
            />
          </label>
        </div>

        {/* Scenario List */}
        <div className="overflow-y-auto pl-[3vw] absolute top-[26vh] left-0 right-0 bottom-0 pr-[1vw]">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario._id}
              className={`p-[2%_3%] my-[1px] rounded-[3px] cursor-pointer transition-colors text-[length:var(--text-s)] font-[family-name:var(--font-dm)] ${
                scenario._id === selectedScenario?._id 
                  ? "text-base-content bg-primary/10" 
                  : "text-primary hover:bg-primary/5 hover:text-base-content"
              }`}
              onClick={() => handleScenarioSelect(scenario)}
            >
              {scenario.name}
            </div>
          ))}
        </div>
      </div>

      {/* Gradient Line */}
      <div className="relative">
        <GradientLine />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        {selectedScenario ? (
          <div className="w-full h-full flex flex-col overflow-y-auto">
            {/* Scenario Header */}
            <div className="text-left pb-[4vh] pl-[8vw] pt-[8vh] pr-[4vw]">
              <h1 className="text-base-content font-light text-[length:var(--text-xl)] font-[family-name:var(--font-dm)] mb-[4vh]">
                {selectedScenario.name}
              </h1>

              {/* Scenario Meta */}
              <div className="flex justify-start gap-[4vw]">
                <div className="flex flex-col items-start">
                  <span className="text-[length:var(--text--1)] text-base-content/60 mb-[1vh] font-[family-name:var(--font-ibm)]">Created By</span>
                  <span className="text-[length:var(--text-s)] text-base-content font-[family-name:var(--font-dm)]">{username}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[length:var(--text--1)] text-base-content/60 mb-[1vh] font-[family-name:var(--font-ibm)]">Mode</span>
                  <span className="text-[length:var(--text-s)] text-base-content font-[family-name:var(--font-dm)]">Multiplayer</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[length:var(--text--1)] text-base-content/60 mb-[1vh] font-[family-name:var(--font-ibm)]">Time Limit</span>
                  <span className="text-[length:var(--text-s)] text-base-content font-[family-name:var(--font-dm)]">--</span>
                </div>
              </div>
            </div>

            {/* Scenario Content */}
            <div className="flex-1 flex flex-col items-start p-[0_4vw_4vh_8vw]">
              {/* Scenario Thumbnail */}
              <div className="w-full max-w-[45vw] max-h-[30vh] mb-[4vh]">
                <div className="w-full h-[40vh] bg-white border border-gray-600 rounded-lg overflow-hidden flex items-center justify-center">
                  <Thumbnail
                    components={selectedScenario.thumbnail?.components || []}
                  />
                </div>
              </div>

              {/* Scenario Description */}
              <div className="w-full max-w-[45vw] pt-[8vh]">
                <h3 className="text-[length:var(--text-m)] font-medium text-base-content text-left mb-[1vh] font-[family-name:var(--font-dm)]">
                  Description
                </h3>
                <div className="flex items-center gap-[3vw]">
                  <p className="text-[length:var(--text-s)] leading-relaxed text-base-content/80 text-left flex-1 font-[family-name:var(--font-ibm)]">
                    Testing scenario - This is a sample scenario for testing the
                    VPS application functionality.
                  </p>

                  <div className="flex-shrink-0">
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
          <div className="text-center text-base-content/60">
            <h2 className="text-[length:var(--text-4)] mb-[2vh] text-base-content/80 font-medium font-[family-name:var(--font-dm)]">
              Select a scenario to get started
            </h2>
            <p className="text-[length:var(--text-m)] text-base-content/60 font-[family-name:var(--font-ibm)]">
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
