import { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import ScenarioContext from "../../context/ScenarioContext";
import Thumbnail from "../authoring/components/Thumbnail";
import CreateScenarioCard from "../../components/CreateScenarioCard/CreateScenarioCard";
import TopNavBar from "../../features/TopNavBar/TopNavBar";
import FabMenu from "../../components/FabMenu";
import { PlusIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import { handle } from "../../components/ContextMenu/portal";
import RightContextMenu from "../../components/ContextMenu/RightContextMenu";

// TODO: delete should be in a better place than this
const ScenarioMenu = ({ scenario, requestDelete }) => {
  return (
    <ul className="menu bg-base-200 rounded-box w-fit">
      <li>
        <button type="button" onClick={handle(requestDelete, scenario)}>
          <Trash2Icon size={16} />
          Delete
        </button>
      </li>
    </ul>
  );
};

export default function CreateLandingPage() {
  const { allScenarios, deleteScenario, createScenario } =
    useContext(ScenarioContext);

  const history = useHistory();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState(null);

  const filteredScenarios = allScenarios.owned.filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(name) {
    setShowCreateModal(false);
    const scenarioId = await createScenario(name);
    history.push(`/scenario/${scenarioId}`);
  }

  function requestDelete(scenario, event) {
    event?.stopPropagation();
    setScenarioToDelete(scenario);
  }

  function handleDelete() {
    if (!scenarioToDelete) return;
    deleteScenario(scenarioToDelete._id);
    setScenarioToDelete(null);
  }

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
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon size={48} absoluteStrokeWidth={2} />
        </div>
        {filteredScenarios.map((scenario) => (
          <RightContextMenu
            menu={
              <ScenarioMenu scenario={scenario} requestDelete={requestDelete} />
            }
            key={scenario._id}
          >
            <div
              className="group relative cursor-pointer"
              onClick={() => history.push(`/scenario/${scenario._id}`)}
            >
              <button
                type="button"
                className="btn btn-circle btn-sm absolute right-s top-s z-10 bg-base-100/90 text-error shadow transition hover:bg-error hover:text-error-content"
                onClick={(event) => requestDelete(scenario, event)}
                aria-label={`Delete ${scenario.name}`}
                title="Delete scenario"
              >
                <Trash2Icon size={16} />
              </button>
              <div className="aspect-16/9 rounded overflow-hidden mb-s border-primary/10 border-1">
                <Thumbnail components={scenario.thumbnail?.components || []} />
              </div>
              <p className="font-ibm text-l text-nowrap truncate">
                {scenario.name}
              </p>
            </div>
          </RightContextMenu>
        ))}
      </div>

      {scenarioToDelete && (
        <div
          className="modal modal-open modal-bottom sm:modal-middle"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-box text-base-content"
            aria-labelledby="delete-scenario-title"
          >
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setScenarioToDelete(null)}
              aria-label="Close delete confirmation"
            >
              <XIcon size={16} />
            </button>
            <h2
              id="delete-scenario-title"
              className="font-ibm text-l font-semibold"
            >
              Delete scenario
            </h2>
            <p className="py-m">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{scenarioToDelete.name}</span>?
              This cannot be undone.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => setScenarioToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn important"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setScenarioToDelete(null)}
            aria-label="Close delete confirmation"
          />
        </div>
      )}

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <CreateScenarioCard
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      <FabMenu />
    </div>
  );
}
