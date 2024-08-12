import { useEffect, useState } from "react";
import resources from "./ResourceObjects";
import styles from "../styling/NotesDisplayCard.module.scss";
import resourceStyles from "../styling/ResourceModal.module.scss";

export default function ResourcesDisplayCard({ handleClose }) {
  const [currentResourceId, setCurrentResourceId] = useState(resources[0].id);

  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const changeResource = (id) => {
    setCurrentResourceId(id);
  };

  const currentResource = resources.find(
    (resource) => resource.id === currentResourceId
  );

  console.log(currentResource);

  return (
    <>
      <div>
        <div
          className={styles.overlay}
          role="button"
          tabIndex={0}
          onClick={handleClose}
          onKeyDown={handleKeyPress}
          aria-label="Close Card"
        />

        <div className={resourceStyles.display_card}>
          <nav className={resourceStyles.navBar}>
            {resources.map((resource) => (
              <p key={resource.id}>
                <button
                  type="button"
                  onClick={() => changeResource(resource.id)}
                  className={
                    currentResourceId === resource.id
                      ? resourceStyles.active
                      : ""
                  }
                >
                  {resource.displayName}
                </button>
              </p>
            ))}
          </nav>
          <div className={resourceStyles.r_content_card}>
            {currentResource.content.map((item) => {
              if (item.type === "text") {
                return (
                  <p key={`text-${currentResource.id}`}>
                    {item.items.map((textItem) => (
                      <p key={`${textItem}-${currentResource.id}`}>
                        {textItem}
                      </p>
                    ))}
                  </p>
                );
              }
              if (item.type === "image") {
                return (
                  <img
                    key={`image-${currentResource.id}`}
                    src={item.src}
                    alt={item.alt}
                    className={styles.resourceImage}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </>
  );
}
