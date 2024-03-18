import { useState } from "react";
import styles from "../../../../../styling/ToolBar.module.scss";

function PlayerListSubContainer({ user = {} }) {
  const { name } = user;
  const [selectedTags, setSelectedTags] = useState([]);
  const availableTags = ["Doctor", "Pharmacist", "Nurse"]; // temp tags

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(
        selectedTags.filter((selectedTag) => selectedTag !== tag)
      );
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className={styles.playerContainer}>
      <div className={styles.userInfo}>
        <div
          className={`${styles.text} ${
            selectedTags.length > 0 ? styles.selected : ""
          }`}
        >
          <p>{name}</p>
        </div>
        <div className={styles.tagContainer}>
          {availableTags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={`${styles.tag} ${
                selectedTags.includes(tag) ? styles.selectedTag : ""
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayerListSubContainer;
