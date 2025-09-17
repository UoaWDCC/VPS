import MenuItem from "@material-ui/core/MenuItem";
import { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import ContextMenu from "../../components/ContextMenu";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import AccessLevel from "../../enums/route.access.level";
import { useDelete } from "../../hooks/crudHooks";
import componentResolver from "./componentResolver";

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
    ... (userScenarios || []),
    ... (assignedScenarios || []).filter((as) => !userScenarios.some((us) => us._id === as._id)),
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
    window.open(`/play/${currentScenario._id}/singleplayer`, '_blank');
  };

  const editScenario = () => {
    if (currentScenario) {
      history.push(`/scenario/${currentScenario._id}`);
    }
  };

  const handleCreate = () => {
    history.push("/scenario/new");
  };

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation */}
        <div className="navbar bg-black text-white mb-8 border-b border-white pb-2">
          <div className="flex-1">
            <button className="btn btn-ghost normal-case text-white">Logout →</button>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal px-1">
              <li><a className="active text-white">Play</a></li>
              <li><a className="text-white" onClick={handleCreate}>Create</a></li>
            </ul>
          </div>
        </div>

        {/* Search Section */}
        <h2 className="text-xl font-bold mb-4">Search scenario</h2>
        <div className="form-control mb-8 relative">
          <div className="input-group flex items-center bg-transparent">
            <span className="bg-transparent border-0 flex items-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search"
              className="input bg-transparent text-white border-0 w-full max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="absolute bottom-[-2px] left-0 w-full max-w-md border-b border-white"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {filteredScenarios.map((scenario) => {
            const thumbnailComponents = scenario.thumbnail?.components || [];
            return (
              <div
                key={scenario._id}
                className="cursor-pointer flex flex-col items-center"
                onClick={() => {
                  setCurrentScenario(scenario);
                  window.open(`/play/${scenario._id}/singleplayer`, '_blank');
                }}
                onContextMenu={(e) => handleContextMenu(e, scenario)}
              >
                <div className="relative w-full min-h-[200px] bg-gray-800 rounded-lg p-4 flex flex-col gap-2">
                  {thumbnailComponents.map((component, index) => componentResolver(component, index, () => {}))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Titles below the grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-4">
          {filteredScenarios.map((scenario) => (
            <h3 key={scenario._id} className="text-center text-xl font-bold">
              {scenario.name}
            </h3>
          ))}
        </div>
      </div>
    </div>
  );
}