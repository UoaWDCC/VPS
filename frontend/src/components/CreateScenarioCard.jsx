import React, { useState } from "react";
import styles from "../styling/CreateScenarioCard.module.scss";

export default function CreateScenarioCard({ onCreate, onClose }) {
  const [name, setName] = useState("default name");

  const handleCreate = async () => {
    console.log(`Creating scenario with name: ${name}`);
    onCreate(name);
    onClose();
  };

  const handleOverlayClick = (event) => {
    event.stopPropagation();
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div>
      <div
        className={styles.overlay}
        role="button"
        onClick={handleOverlayClick}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        aria-label="Close Create Scenario Card"
      />
      <div className={styles.createScenarioCard}>
        {" "}
        <h2>Create New Scenario</h2>
        <input
          type="text"
          placeholder="Scenario name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" onClick={handleCreate}>
          Create
        </button>
      </div>
    </div>
  );
}
