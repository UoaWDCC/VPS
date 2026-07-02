import { useState } from "react";

function DetailEditModal({ scenario, onSave, submitLabel = "Save Changes" }) {
  const [description, setDescription] = useState(scenario?.description ?? "");
  const [name, setName] = useState(scenario?.name ?? "");
  const [estimatedTime, setEstimatedTime] = useState(
    scenario?.estimatedTime ?? ""
  );

  function handleEstimatedTimeChange(e) {
    const value = e.target.value.replace(/\D/g, "");
    setEstimatedTime(value);
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
          className="input input-bordered border-primary/30 bg-base-100 text-base-content font-dm text-base w-full focus:border-primary focus:outline-none placeholder:text-base-content/40"
          maxLength={100}
        />
        <label className="label">
          <span className="label-text-alt text-base-content/50 font-ibm">
            {name.length}/100 characters
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
        {/* buttons will automatically close the dialog */}
        <button className="btn btn-ghost text-primary hover:text-base-content hover:bg-primary/10 font-dm">
          Cancel
        </button>
        <button
          onClick={() => onSave({ name, description, estimatedTime })}
          className={`btn btn-ghost text-base-content border border-base-content/20 hover:bg-base-content/10 hover:border-base-content/40 font-dm`}
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}

export default DetailEditModal;
