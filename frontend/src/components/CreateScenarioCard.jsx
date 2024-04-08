import React, { useState } from "react";

const CreateScenarioCard = () => {
  const [name, setName] = useState("default name");

  const handleCreate = async () => {
    console.log(`Creating scenario with name: ${name}`);
  };

  return (
    <div>
      <h2>Create New Scenario</h2>
      <input
        type="text"
        placeholder="Scenario name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}