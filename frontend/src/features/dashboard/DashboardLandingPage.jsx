import { useState, useContext, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import ScenarioContext from "../../context/ScenarioContext";
import TopNavBar from "../TopNavBar/TopNavBar";
import Thumbnail from "../authoring/components/Thumbnail";
import "../playScenario/PlayLandingPage.css";

export default function DashboardLandingPage() {
  const {
    scenarios: userScenarios,
    assignedScenarios,
    reFetch,
    reFetch2,
    setCurrentScenario,
  } = useContext(ScenarioContext);
  const history = useHistory();

  const [search, setSearch] = useState("");

  useEffect(() => {
    reFetch();
    reFetch2();
  }, []);

  const allScenarios = useMemo(
    () => [
      ...(userScenarios || []),
      ...(assignedScenarios || []).filter(
        (as) => !userScenarios?.some((us) => us._id === as._id)
      ),
    ],
    [userScenarios, assignedScenarios]
  );

  const filteredScenarios = allScenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectDashboardScenario = (scenario) => {
    setCurrentScenario(scenario);
    history.push(`/dashboard/${scenario._id}`);
  };

  return (
    <div className="play-container" data-theme="dark">
      <TopNavBar activeTab="dashboard" />

      <div className="play-header">
        <h1 className="play-title">Dashboard</h1>
      </div>

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
            onClick={() => selectDashboardScenario(scenario)}
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
