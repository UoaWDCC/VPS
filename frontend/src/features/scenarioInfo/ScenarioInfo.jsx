import { useState, useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
import DiamondPlayButton from "./components/DiamondPlayButton";
import Thumbnail from "../authoring/components/Thumbnail";
import ScenarioContext from "../../context/ScenarioContext";
import AuthenticationContext from "../../context/AuthenticationContext";
import { usePatch } from "../../hooks/crudHooks";
import FabMenu from "../../components/FabMenu";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";
import ModalDialog from "../../components/ModalDialogue";
import DetailEditModal from "./components/DetailEditModal";
import toast from "react-hot-toast";

function ScenarioInfo() {
  const [searchTerm, setSearchTerm] = useState("");

  const { VpsUser, getUserIdToken } = useContext(AuthenticationContext);
  const {
    scenarios: ownedScenarios,
    assignedScenarios,
    reFetch,
  } = useContext(ScenarioContext);

  const history = useHistory();
  const location = useLocation();

  const [showEditModal, setShowEditModal] = useState(false);

  const scenarios = [...(ownedScenarios ?? []), ...(assignedScenarios ?? [])];
  const username = VpsUser.firebaseUserObj.displayName || "User";

  const selectedScenarioId = new URLSearchParams(location.search).get("id");
  const selectedScenario = scenarios.find((s) => s._id === selectedScenarioId);

  const filteredScenarios = scenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScenarioSelect = (scenario) => {
    history.replace(`/scenario-info?id=${scenario._id}`);
  };

  const handlePlayScenario = (scenario) => {
    window.open(`/play/${scenario._id}`, "_blank");
  };

  const handleBackToPlay = () => {
    history.push("/play");
  };

  const openEditModal = () => {
    setShowEditModal(true);
  };

  // TODO: should use optimistic updating here
  async function saveScenarioDetails(name, description, estimatedTime) {
    try {
      await usePatch(
        `/api/scenario/${selectedScenario._id}`,
        { name, description, estimatedTime },
        getUserIdToken
      );
      reFetch();
    } catch (error) {
      console.error("Error saving scenario details:", error);
      toast.error("Failed to save changes. Please try again.");
    }
  }

  return (
    <div className="bg-base-100 text-base-content">
      {/* Responsive Container optimised for 900x500 min to 1600x900 max */}
      <button
        className="fixed z-10 btn btn-phantom text-m ml-xl mt-l font-dm px-0"
        onClick={handleBackToPlay}
      >
        <ArrowLeftIcon size={20} />
        Back
      </button>
      <div className="min-w-[900px] max-w-[1500px] mx-auto flex gap-3xl px-xl">
        {/* Sidebar */}
        {/* the calc used in the padding top is to get the searchbar to align with the scenario metadata, by imitating the same sizing flow */}
        <div className="w-1/5 min-w-[320px] flex-shrink-0 sticky top-0 h-screen overflow-hidden pt-[calc(var(--spacing-4xl)+var(--spacing-xl)+var(--spacing-l))]">
          <div className="h-full flex flex-col gap-m">
            {/* Search Container - Positioned above the list */}
            {/* TODO: for future person, replace this with the .search class if its available */}
            <div className="bg-transparent flex-shrink-0">
              <label className="bg-transparent gap-1 flex items-center flex-row-reverse">
                <SearchIcon size={18} className="text-primary flex-shrink-0" />
                <input
                  type="search"
                  placeholder="Search scenario"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-base-content text-s placeholder:text-primary font-dm min-w-0"
                  required
                />
              </label>
              {/* Simple line under search bar */}
              <div className="h-px bg-primary mt-2xs"></div>
            </div>

            {/* Scenario List */}
            <div className="overflow-y-auto flex-1">
              {filteredScenarios.map((scenario) => (
                <div
                  key={scenario._id}
                  className={`mb-2xs cursor-pointer transition-colors text-s font-dm truncate ${scenario._id === selectedScenario?._id
                      ? "text-base-content"
                      : "text-primary hover:text-base-content"
                    }`}
                  onClick={() => handleScenarioSelect(scenario)}
                >
                  {scenario.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pt-4xl pb-2xl">
          {selectedScenario ? (
            <div className="w-full flex flex-col overflow-x-hidden gap-m">
              {/* Scenario Header */}
              <div>
                <div className="mb-l">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-base-content font-light text-xl font-ibm">
                      {selectedScenario.name}
                    </h1>
                    <button
                      onClick={openEditModal}
                      className="btn btn-sm btn-ghost text-base-content border border-base-content/20 hover:bg-base-content/10 hover:border-base-content/40 font-dm flex-shrink-0"
                    >
                      Edit Details
                    </button>
                  </div>
                </div>

                {/* Scenario Meta */}
                <div className="flex justify-start gap-[3vw] flex-wrap">
                  <div className="flex flex-col items-start">
                    <span className="text-m text-primary mb-[1vh] font-dm">
                      Created By
                    </span>
                    <span className="text-s text-base-content font-dm">
                      {username}
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-m text-primary mb-[1vh] font-dm">
                      Mode
                    </span>
                    <span className="text-s text-base-content font-dm">
                      Multiplayer
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-m text-primary mb-[1vh] font-dm">
                      Estimated Time
                    </span>
                    <span className="text-s text-base-content font-dm">
                      {selectedScenario.estimatedTime
                        ? `${selectedScenario.estimatedTime} min`
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario Thumbnail */}
              <div className="w-full max-w-[45vw] mb-[3vh] flex-shrink-0">
                <div className="w-full aspect-video bg-white border border-gray-600 rounded-lg overflow-hidden flex items-center justify-center">
                  <Thumbnail
                    components={selectedScenario.thumbnail.components}
                  />
                </div>
              </div>

              <div className="w-full flex flex-shrink-0 flex-wrap gap-2xl">
                {/* Scenario Description */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-m text-primary mb-3xs font-dm">
                    Description
                  </h3>
                  <p className="text-s text-base-content text-left min-h-[4em] font-dm break-words text-wrap">
                    {selectedScenario.description ||
                      "This scenario doesn't have a description."}
                  </p>
                </div>
                {/* Play Button */}
                <div className="p-8">
                  <DiamondPlayButton
                    onClick={() => handlePlayScenario(selectedScenario)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-base-content/60">
              <h2 className="text-4 mb-[2vh] text-base-content/80 font-medium font-dm">
                Select a scenario to get started
              </h2>
              <p className="text-m text-base-content/60 font-ibm">
                Choose from the scenarios on the left to view details and begin
                training.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Details Modal */}
      <ModalDialog
        title="Edit Scenario Details"
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
      >
        <DetailEditModal
          scenario={selectedScenario}
          onSave={saveScenarioDetails}
        />
      </ModalDialog>

      <FabMenu />
    </div>
  );
}

export default ScenarioInfo;
