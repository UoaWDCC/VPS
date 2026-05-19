import { useState, useEffect, useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
import DiamondPlayButton from "./components/DiamondPlayButton";
import Thumbnail from "../authoring/components/Thumbnail";
import ScenarioContext from "../../context/ScenarioContext";
import AuthenticationContext from "../../context/AuthenticationContext";
import { usePatch } from "../../hooks/crudHooks";
import FabMenu from "../../components/FabMenu";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";

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
                  className={`mb-2xs cursor-pointer transition-colors text-s font-dm truncate ${
                    scenario._id === selectedScenario?._id
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
                      {editableEstimatedTime
                        ? `${editableEstimatedTime} min`
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario Thumbnail */}
              <div className="w-full max-w-[750px] flex-shrink-0">
                <div className="w-full aspect-video bg-white border border-gray-600 rounded-lg overflow-hidden flex items-center justify-center">
                  <Thumbnail
                    components={selectedScenario.thumbnail?.components || []}
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
                    {editableDescription ||
                      "No description available. Click 'Edit Details' to add one."}
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
