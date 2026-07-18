import { useState } from "react";

function DetailEditModal({
  scenario,
  onSave,
  onClose,
  submitLabel = "Save Changes",
  pendingLabel = "Saving...",
}) {
  const [description, setDescription] = useState(scenario?.description ?? "");
  const [name, setName] = useState(scenario?.name ?? "");
  const [estimatedTime, setEstimatedTime] = useState(
    scenario?.estimatedTime ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameError, setShowNameError] = useState(false);

  const isNameBlank = !name.trim();

  function handleEstimatedTimeChange(e) {
    const value = e.target.value.replace(/\D/g, "");
    setEstimatedTime(value);
  }

  async function handleSave() {
    if (isNameBlank) {
      setShowNameError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ name: name.trim(), description, estimatedTime });
      onClose?.();
    } catch {
      // the mutation itself surfaces an error toast; keep the modal open to retry
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Name Field */}
      <div className="form-control mb-6">
        <label className="label">
          <span className="label-text text-base-content/80 font-ibm text-sm">
            Scenario Name
          </span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter scenario name..."
          className={`input input-bordered bg-base-100 text-base-content font-dm text-base w-full focus:outline-none placeholder:text-base-content/40 ${
            showNameError && isNameBlank
              ? "border-error focus:border-error"
              : "border-primary/30 focus:border-primary"
          }`}
          maxLength={100}
        />
        <label className="label">
          <span
            className={`label-text-alt font-ibm ${showNameError && isNameBlank ? "text-error" : "text-base-content/50"}`}
          >
            {showNameError && isNameBlank
              ? "Scenario name is required"
              : `${name.length}/100 characters`}
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter scenario description..."
          className="textarea textarea-bordered border-primary/30 bg-base-100 text-base-content h-32 font-ibm text-base w-full focus:border-primary focus:outline-none placeholder:text-base-content/40"
          maxLength={200}
        />
        <label className="label">
          <span className="label-text-alt text-base-content/50 font-ibm">
            {description.length}/200 characters
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
          value={estimatedTime}
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
        {/* Cancel keeps the native dialog auto-close behaviour */}
        <button
          disabled={isSubmitting}
          className="btn btn-ghost text-primary hover:text-base-content hover:bg-primary/10 font-dm"
        >
          Cancel
        </button>
        {/* type="button" so a click doesn't submit-close the dialog before the save resolves */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className={`btn btn-ghost text-base-content border border-base-content/20 hover:bg-base-content/10 hover:border-base-content/40 font-dm`}
        >
          {isSubmitting ? pendingLabel : submitLabel}
        </button>
      </div>
    </>
  );
}

export default DetailEditModal;
