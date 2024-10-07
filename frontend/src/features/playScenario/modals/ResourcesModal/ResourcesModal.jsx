import { useEffect, useState } from "react";
import styles from "../NotesModal/NotesModal.module.scss";
import resourceStyles from "./ResourcesModal.module.scss";

function ResourcesModal({ handleClose, resources }) {
  const [currentResourceId, setCurrentResourceId] = useState(resources[0]?._id);

  const handleKeyPress = (e) => {
    if (e.key === "Escape") handleClose();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const currentResource = resources.find(
    ({ _id }) => _id === currentResourceId
  );

  const ResourceContent = ({ item }) => {
    const hasTextContent =
      item.textContent?.length > 0 && item.textContent[0] !== "";
    const hasImageContent = item.imageContent && item.imageContent !== "";

    return (
      <div>
        {hasTextContent &&
          item.textContent.map((textItem) => <p key={textItem}>{textItem}</p>)}
        {hasImageContent && (
          <img
            className={resourceStyles.resourceImage}
            src={item.imageContent}
            alt={item.name || "Resource Image"}
          />
        )}
        {!hasTextContent && !hasImageContent && <p>No Content Available</p>}
      </div>
    );
  };

  return (
    <div>
      <button
        className={styles.overlay}
        type="button"
        onClick={handleClose}
        aria-label="Close Card"
      />
      <div className={resourceStyles.display_card}>
        <button
          type="button"
          className={resourceStyles.closeButton}
          onClick={handleClose}
        >
          &times;
        </button>
        <h2 className={resourceStyles.modalHeading}>Resources</h2>

        {/* DaisyUI Tabs Implementation */}
        <div role="tablist" className="tabs tabs-bordered">
          {resources.map((resource) => (
            <a
              key={resource._id}
              role="tab"
              onClick={() => setCurrentResourceId(resource._id)}
              className={`tab ${
                currentResourceId === resource._id
                ? "tab-active text-[#035084] border-white font-bold" 
                  : ""
              }`}
            >
              {resource.name}
            </a>
          ))}
        </div>

        <div className={resourceStyles.r_content_card}>
          {currentResource ? (
            <ResourceContent item={currentResource} />
          ) : (
            <p>No Resource Selected</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourcesModal;
