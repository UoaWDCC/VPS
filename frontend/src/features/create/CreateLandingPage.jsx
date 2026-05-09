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
import FabMenu from "../../components/FabMenu";
import { PlusIcon, SearchIcon } from "lucide-react";

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

  return (
    <div className="bg-base-100 h-full text-base-content pt-5xl px-xl max-w-[1500px] mx-auto">
      <TopNavBar />

      {/* Header */}
      <h1 className="font-ibm text-xl mb-l">Create & Edit</h1>

      {/* Search Section */}
      <label className="input search w-full max-w-[40vw] mb-m">
        <input
          type="search"
          placeholder="Search scenarios"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          required
        />
        <SearchIcon size={20} />
      </label>

      <div className="grid grid-cols-4 gap-x-l gap-y-xl pb-2xl">
        <div className="flex items-center justify-center bg-transparent border-1 border-primary text-secondary aspect-16/9 rounded cursor-pointer hover:-translate-y-1 duration-100 ease" onClick={handleCreate}>
          <PlusIcon size={48} absoluteStrokeWidth={2} />
        </div>
        {filteredScenarios.map((scenario) => (
          <div
            key={scenario._id}
            className="cursor-pointer hover:-translate-y-1 duration-100 ease"
            onClick={() => history.push(`/scenario/${scenario._id}`)}
            onContextMenu={(e) => handleContextMenu(e, scenario)}
          >
            <div className="aspect-16/9 rounded overflow-hidden mb-s border-primary/10 border-1">
              <Thumbnail components={scenario.thumbnail?.components || []} />
            </div>
            <p className="font-ibm text-l text-nowrap truncate">{scenario.name}</p>
          </div>
        ))}
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

      <FabMenu />
    </div>
  );
}
