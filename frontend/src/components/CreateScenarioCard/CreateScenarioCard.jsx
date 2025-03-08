import { useState } from "react";

export default function CreateScenarioCard({ onCreate, onClose }) {
  const [name, setName] = useState("default name");

  const handleCreate = async () => {
    console.log(`Creating scenario with name: ${name}`);
    onCreate(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="relative max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-black"
          onClick={onClose}
        >
          ✕
        </button>
        <h1 className="text-xl font-bold mb-4 text-center text-black">
          Create New Scenario
        </h1>
        <div className="flex items-center space-x-4 mb-4">
          <h3 className="text-lg text-black">Scenario name:</h3>
          <input
            type="text"
            placeholder="Scenario name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered flex-1 text-black bg-white"
          />
        </div>
        <div className="flex justify-center">
          <button className="btn vps" onClick={handleCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
