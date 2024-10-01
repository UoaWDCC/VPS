import { useState } from "react";
import Button from "@material-ui/core/Button";
import styles from "./CreateScenarioCard.module.scss";

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
        <h1>Create New Scenario</h1>
        <h3>Scenario name:</h3>
        <input
          type="text"
          placeholder="Scenario name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {/* <Button
          className="btn side contained blue"
          type="button"
          onClick={handleCreate}
        >
          Create
        </Button> */}
        <button
          className="btn btn-primary text-secondary"
          onClick={handleCreate}
        >
          Create
        </button>
      </div>
    </div>
  );
}
