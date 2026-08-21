import { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import ScenarioContext from "../../context/ScenarioContext";
import Thumbnail from "../authoring/components/Thumbnail";
import ModalDialog from "../../components/ModalDialogue";
import DetailEditModal from "../scenarioInfo/components/DetailEditModal";
import TopNavBar from "../../features/TopNavBar/TopNavBar";
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { handle } from "../../components/ContextMenu/portal";
import RightContextMenu from "../../components/ContextMenu/RightContextMenu";
import DeleteScenarioModal from "./DeleteScenarioModal";

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
  const { allScenarios, createScenario } = useContext(ScenarioContext);

  const history = useHistory();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState(null);

  const scenarios = Array.from(
    new Map(
      [...allScenarios.owned, ...allScenarios.accessible].map((scenario) => [
        scenario._id,
        scenario,
      ])
    ).values()
  );

  const filteredScenarios = scenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(details) {
    const scenarioId = await createScenario(details);
    history.push(`/scenario/${scenarioId}`);
  }

  function requestDelete(scenario, event) {
    event?.stopPropagation();
    setScenarioToDelete(scenario);
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
              className="relative cursor-pointer"
              onClick={() => history.push(`/scenario/${scenario._id}`)}
            >
              <button
                type="button"
                className="btn btn-circle btn-sm absolute right-xs top-xs z-10 bg-base-100/80 text-error shadow-none border-none transition hover:bg-error hover:text-error-content"
                onClick={(event) => requestDelete(scenario, event)}
                aria-label={`Delete ${scenario.name}`}
                title="Delete scenario"
              >
                <Trash2Icon size={16} />
              </button>
              <div className="hover:-translate-y-1 duration-100 ease">
                <div className="aspect-16/9 rounded overflow-hidden mb-s border-primary/10 border-1">
                  <Thumbnail
                    components={scenario.thumbnail?.components || []}
                  />
                </div>
                <p className="font-ibm text-l text-nowrap truncate">
                  {scenario.name}
                </p>
              </div>
            </div>
          </RightContextMenu>
        ))}
      </div>

      <DeleteScenarioModal
        scenario={scenarioToDelete}
        open={!!scenarioToDelete}
        setOpen={() => setScenarioToDelete(null)}
      />

      {/* Create Scenario Modal */}
      <ModalDialog
        title="Create Scenario"
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      >
        <DetailEditModal
          scenario={null}
          submitLabel="Create"
          pendingLabel="Creating..."
          onSave={handleCreate}
        />
      </ModalDialog>
    </div>
  );
}
