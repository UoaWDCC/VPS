import React, { useState } from "react";
import styles from "../styling/CreateScenarioCard.module.scss";

export default function CreateScenarioCard({ isVisible, onClose }) {
  const [name, setName] = useState("default name");

  const handleCreate = async () => {
    console.log(`Creating scenario with name: ${name}`);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.createScenarioCard}>
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
