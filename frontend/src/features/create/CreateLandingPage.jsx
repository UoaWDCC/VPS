import { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import { useDelete, usePost } from "../../hooks/crudHooks";
import Thumbnail from "../authoring/components/Thumbnail";
import CreateScenarioCard from "../../components/CreateScenarioCard/CreateScenarioCard";
import TopNavBar from "../../features/TopNavBar/TopNavBar";
import FabMenu from "../../components/FabMenu";
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { handle } from "../../components/ContextMenu/portal";
import RightContextMenu from "../../components/ContextMenu/RightContextMenu";

// TODO: delete should be in a better place than this
const ScenarioMenu = ({ id, deleteScenario }) => {
  return (
    <ul className="menu bg-base-200 rounded-box w-fit">
      <li>
        <a onClick={handle(deleteScenario, id)}>
          <Trash2Icon size={16} />
          Delete
        </a>
      </li>
    </ul>
  );
};

export default function CreateLandingPage() {
  const { allScenarios, reFetch } = useContext(ScenarioContext);

  const { getUserIdToken } = useContext(AuthenticationContext);
  const history = useHistory();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredScenarios = allScenarios.owned.filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteScenario = async (scenarioId) => {
    await useDelete(`/api/scenario/${scenarioId}`, getUserIdToken);
    reFetch();
  };

  const handleCreate = () => setShowCreateModal(true);

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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] xl:grid-cols-4 gap-x-l gap-y-xl pb-2xl">
        <div
          className="flex items-center justify-center bg-transparent border-1 border-primary text-secondary aspect-16/9 rounded cursor-pointer hover:-translate-y-1 duration-100 ease"
          onClick={handleCreate}
        >
          <PlusIcon size={48} absoluteStrokeWidth={2} />
        </div>
        {filteredScenarios.map((scenario) => (
          <RightContextMenu
            menu={<ScenarioMenu id={scenario._id} deleteScenario={deleteScenario} />}
            key={scenario._id}
          >
            <div
              className="cursor-pointer hover:-translate-y-1 duration-100 ease"
              onClick={() => history.push(`/scenario/${scenario._id}`)}
            >
              <div className="aspect-16/9 rounded overflow-hidden mb-s border-primary/10 border-1">
                <Thumbnail components={scenario.thumbnail?.components || []} />
              </div>
              <p className="font-ibm text-l text-nowrap truncate">{scenario.name}</p>
            </div>
          </RightContextMenu>
        ))}
      </div>
      {/* Create Scenario Modal */}
      {
        showCreateModal && (
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
              history.push(`/scenario/${newScenario._id}`);
              reFetch();
              setShowCreateModal(false);
            }}
            onClose={() => setShowCreateModal(false)}
          />
        )
      }

      <FabMenu />
    </div >
  );
}
