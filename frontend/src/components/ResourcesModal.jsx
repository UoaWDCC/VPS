import { useEffect, useState } from "react";
import resources from "./ResourceObjects";
import styles from "../styling/NotesDisplayCard.module.scss";
import resourceStyles from "../styling/ResourceModal.module.scss";

function ResourcesModal({ handleClose }) {
  const [currentResourceId, setCurrentResourceId] = useState(resources[0]?.id);

  const handleKeyPress = (e) => {
    if (e.key === "Escape") handleClose();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const currentResource = resources.find(({ id }) => id === currentResourceId);

  const ResourceContent = ({ item }) => {
    if (item.type === "text") {
      return (
        <p>
          {item.items.map((textItem) => (
            <p>{textItem}</p>
          ))}
        </p>
      );
    }
    if (item.type === "image") {
      return (
        <img
          className={resourceStyles.resourceImage}
          src={item.src}
          alt={item.alt}
        />
      );
    }
    return null;
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
        <nav className={resourceStyles.navBar}>
          {resources.map((resource) => (
            <p key={resource.id}>
              <button
                type="button"
                onClick={() => setCurrentResourceId(resource.id)}
                className={
                  currentResourceId === resource.id ? resourceStyles.active : ""
                }
              >
                {resource.displayName}
              </button>
            </p>
          ))}
        </nav>
        <div className={resourceStyles.r_content_card}>
          {currentResource?.content.map((item) => (
            <ResourceContent item={item} />
          )) || <p>No Resource Selected</p>}
        </div>
      </div>
    </div>
  );
}

export default ResourcesModal;
