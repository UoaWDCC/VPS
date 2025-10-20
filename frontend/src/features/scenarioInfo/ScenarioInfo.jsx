import { useState, useEffect, useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
import DiamondPlayButton from "./components/DiamondPlayButton";
import Thumbnail from "../authoring/components/Thumbnail";
import ScenarioContext from "../../context/ScenarioContext";
import AuthenticationContext from "../../context/AuthenticationContext";
import { usePatch } from "../../hooks/crudHooks";
import FabMenu from "../../components/FabMenu";

function ScenarioInfo() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [editableEstimatedTime, setEditableEstimatedTime] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const scenarioContext = useContext(ScenarioContext);
  const { VpsUser, getUserIdToken } = useContext(AuthenticationContext);

  const scenarios = scenarioContext?.scenarios || [];
  const username = VpsUser.firebaseUserObj.displayName || "User";

  // Get scenario ID from URL and set that as the selected scenario
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const scenarioId = searchParams.get("id");

    if (scenarioId && scenarios.length > 0) {
      const scenario = scenarios.find((s) => s._id === scenarioId);
      if (scenario) {
        setSelectedScenario(scenario);
        setEditableTitle(scenario.name || "");
        setEditableDescription(scenario.description || "");
        setEditableEstimatedTime(scenario.estimatedTime || "");
      }
    }
  }, [location.search, scenarios]);

  const filteredScenarios = scenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    setEditableTitle(scenario.name || "");
    setEditableDescription(scenario.description || "");
    setEditableEstimatedTime(scenario.estimatedTime || "");
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

  const closeEditModal = () => {
    setShowEditModal(false);

    if (selectedScenario) {
      setEditableTitle(selectedScenario.name || "");
      setEditableDescription(selectedScenario.description || "");
      setEditableEstimatedTime(selectedScenario.estimatedTime || "");
    }
  };

  const handleEstimatedTimeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setEditableEstimatedTime(value);
  };

  const saveScenarioDetails = async () => {
    if (!selectedScenario) return;

    setIsSaving(true);

    try {
      // Save all changes in a single PATCH request
      await usePatch(
        `/api/scenario/${selectedScenario._id}`,
        {
          name: editableTitle,
          description: editableDescription,
          estimatedTime: editableEstimatedTime,
        },
        getUserIdToken
      );

      // Update local state
      const updatedScenario = {
        ...selectedScenario,
        name: editableTitle,
        description: editableDescription,
        estimatedTime: editableEstimatedTime,
      };
      setSelectedScenario(updatedScenario);

      // Refetch scenarios to sync with context
      scenarioContext?.reFetch?.();

      // Close modal
      setShowEditModal(false);
    } catch (error) {
      console.error("Error saving scenario details:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-base-100 text-base-content min-h-screen relative overflow-x-hidden">
      {/* Back Button */}
      <button
        className="absolute z-50 bg-transparent border-none text-primary cursor-pointer hover:text-base-content transition-colors px-8 py-6 top-0 left-0 font-dm text-s"
        onClick={handleBackToPlay}
      >
        ← Back
      </button>
      {/* Responsive Container optimised for 1024x768 min to 1600x900 max */}
      <div className="min-w-[1024px] max-w-[1600px] mx-auto px-8 lg:px-16 xl:px-24 h-screen flex relative overflow-hidden">
        {/* Sidebar */}
        <div className="w-[27%] bg-base-100 flex flex-col relative h-full overflow-hidden flex-shrink-0">
          {/* Spacer to push content down */}
          <div className="h-[35vh] flex-shrink-0"></div>

          {/* Search Container - Positioned above the list */}
          <div className="bg-transparent px-[5%] py-[2vh] absolute top-[20vh] left-0 right-0 z-10 flex-shrink-0">
            <label className="bg-transparent gap-[2vw] flex items-center flex-row-reverse">
              <svg
                className="h-m w-m opacity-50 flex-shrink-0 stroke-current"
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
                className="flex-1 bg-transparent border-none outline-none text-base-content text-s placeholder:text-primary/60 font-ibm"
                required
              />
            </label>
            {/* Simple line under search bar */}
            <div className="h-px bg-primary/20 mt-3"></div>
          </div>

          {/* Scenario List */}
          <div className="overflow-y-auto px-[5%] absolute top-[28vh] left-0 right-0 bottom-0">
            {filteredScenarios.map((scenario) => (
              <div
                key={scenario._id}
                className={`p-[2%_3%] my-[1px] rounded-[3px] cursor-pointer transition-colors text-s font-dm ${
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

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center overflow-hidden min-w-0">
          {selectedScenario ? (
            <div className="w-full h-full flex flex-col overflow-y-auto overflow-x-hidden">
              {/* Scenario Header */}
              <div className="text-left pb-[3vh] pl-[6vw] pt-[6vh] pr-[4vw] flex-shrink-0 max-w-full">
                <div className="mb-[3vh]">
                  <div className="flex items-center gap-3 mb-[1vh]">
                    <h1 className="text-base-content font-light text-xl font-dm">
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
                    <span className="text--1 text-base-content/60 mb-[1vh] font-ibm">
                      Created By
                    </span>
                    <span className="text-s text-base-content font-dm">
                      {username}
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text--1 text-base-content/60 mb-[1vh] font-ibm">
                      Mode
                    </span>
                    <span className="text-s text-base-content font-dm">
                      Multiplayer
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text--1 text-base-content/60 mb-[1vh] font-ibm">
                      Estimated Time
                    </span>
                    <span className="text-s text-base-content font-dm">
                      {editableEstimatedTime
                        ? `${editableEstimatedTime} min`
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario Content */}
              <div className="flex-1 flex flex-col items-start p-[0_4vw_4vh_6vw] overflow-y-hidden overflow-x-hidden max-w-full">
                {/* Scenario Thumbnail */}
                <div className="w-full max-w-[45vw] mb-[3vh] flex-shrink-0">
                  <div className="w-full aspect-video bg-white border border-gray-600 rounded-lg overflow-hidden flex items-center justify-center">
                    <Thumbnail
                      components={selectedScenario.thumbnail?.components || []}
                    />
                  </div>
                </div>

                {/* Scenario Description */}
                <div className="w-full max-w-[50vw] pt-[2vh] relative flex-shrink-0 pb-[2vh]">
                  <h3 className="text-text-m text-base-content text-left font-dm mb-[1vh]">
                    Description
                  </h3>
                  <div className="mt-[1vh] flex items-start gap-6 flex-wrap">
                    <p className="text-[clamp(0.875rem,1vw,1.125rem)] leading-relaxed text-base-content/80 text-left font-ibm min-h-[4em] break-words flex-1 max-w-[35vw] min-w-[200px]">
                      {editableDescription ||
                        "No description available. Click 'Edit Details' to add one."}
                    </p>

                    {/* Play Button */}
                    <div className="flex-shrink-0 ml-8 -mt-4">
                      <DiamondPlayButton
                        size={100}
                        onClick={() => handlePlayScenario(selectedScenario)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-base-content/60">
              <h2 className="text-4 mb-[2vh] text-base-content/80 font-medium font-dm">
                Select a scenario to get started
              </h2>
              <p className="text-m text-base-content/60 font-ibm">
                Choose from the medical scenarios on the left to view details
                and begin training.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Details Modal */}
      {showEditModal && (
        <dialog open className="modal modal-open fixed inset-0 z-[9999]">
          <div className="modal-box bg-base-100 border border-primary/20 w-[600px] max-w-[90vw] p-8">
            <h3 className="font-bold text-2xl mb-6 text-base-content font-dm">
              Edit Scenario Details
            </h3>

            {/* Title Field */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text text-base-content/80 font-ibm text-sm">
                  Scenario Title
                </span>
              </label>
              <input
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                placeholder="Enter scenario title..."
                className="input input-bordered border-primary/30 bg-base-100 text-base-content font-dm text-base w-full focus:border-primary focus:outline-none placeholder:text-base-content/40"
                maxLength={100}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50 font-ibm">
                  {editableTitle.length}/100 characters
                </span>
              </label>
            </div>

            {/* Description Field */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text text-base-content/80 font-ibm text-sm">
                  Description
                </span>
              </label>
              <textarea
                value={editableDescription}
                onChange={(e) => setEditableDescription(e.target.value)}
                placeholder="Enter scenario description..."
                className="textarea textarea-bordered border-primary/30 bg-base-100 text-base-content h-32 font-ibm text-base w-full focus:border-primary focus:outline-none placeholder:text-base-content/40"
                maxLength={200}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50 font-ibm">
                  {editableDescription.length}/200 characters
                </span>
              </label>
            </div>

            {/* Estimated Time Field */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text text-base-content/80 font-ibm text-sm">
                  Estimated Time (minutes)
                </span>
              </label>
              <input
                type="text"
                value={editableEstimatedTime}
                onChange={handleEstimatedTimeChange}
                placeholder="e.g., 30"
                className="input input-bordered border-primary/30 bg-base-100 text-base-content font-dm text-base w-full focus:border-primary focus:outline-none placeholder:text-base-content/40"
                maxLength={4}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50 font-ibm">
                  Numbers only (e.g., 30 for 30 minutes)
                </span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="modal-action">
              <button
                onClick={closeEditModal}
                className="btn btn-ghost text-primary hover:text-base-content hover:bg-primary/10 font-dm"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveScenarioDetails}
                className={`btn btn-ghost text-base-content border border-base-content/20 hover:bg-base-content/10 hover:border-base-content/40 font-dm ${isSaving ? "loading" : ""}`}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop bg-black/60"
            onClick={closeEditModal}
          >
            <button className="cursor-default">close</button>
          </form>
        </dialog>
      )}
      <FabMenu />
    </div>
  );
}

export default ScenarioInfo;
