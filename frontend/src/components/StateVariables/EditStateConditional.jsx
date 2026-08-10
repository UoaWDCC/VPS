import { useContext, useEffect, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import SelectInput from "../../features/authoring/components/Select";
import { stateTypes, validComparators } from "./stateTypes";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api } from "../../util/api";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

function deleteStateConditional(user, scenarioId, resourceId, conditionalId) {
  return api.delete(
    user,
    `api/resources/${scenarioId}/${resourceId}/conditionals/${conditionalId}`
  );
}

function editStateConditional(user, scenarioId, resourceId, conditional) {
  return api.put(
    user,
    `api/resources/${scenarioId}/${resourceId}/conditionals`,
    { stateConditional: conditional }
  );
}

/**
 * Component used for editing state operations
 * State operations are used to manipulate state variables while playing through a scenario
 *
 * @component
 */
const EditStateConditional = ({ resource, conditional }) => {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);
  const { stateVariables } = useContext(ScenarioContext);

  const [comparator, setComparator] = useState(conditional.comparator);
  const [value, setValue] = useState(conditional.value);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (conditional.comparator !== comparator)
      setComparator(conditional.comparator);
    if (conditional.value !== value) setValue(conditional.value);
  }, [conditional]);

  const deleteConditionalMutation = useMutation({
    mutationFn: (conditionalId) =>
      deleteStateConditional(user, scenarioId, resource._id, conditionalId),
    onMutate: (conditionalId) => {
      queryClient.cancelQueries(["resources", scenarioId]);
      queryClient.setQueryData(["resources", scenarioId], (prev) => {
        return prev.map((r) =>
          r._id !== resource._id
            ? r
            : {
                ...r,
                stateConditionals: r.stateConditionals.filter(
                  (c) => c._id !== conditionalId
                ),
              }
        );
      });
    },
    onSettled: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e) => {
      console.error(e);
      toast.error("Error deleting state conditional");
    },
  });

  const updateConditionalMutation = useMutation({
    mutationFn: (conditional) =>
      editStateConditional(user, scenarioId, resource._id, conditional),
    onMutate: (conditional) => {
      queryClient.cancelQueries(["resources", scenarioId]);
      queryClient.setQueryData(["resources", scenarioId], (prev) => {
        return prev.map((r) =>
          r._id !== resource._id
            ? r
            : {
                ...r,
                stateConditionals: r.stateConditionals.map((c) =>
                  c._id !== conditional._id ? c : conditional
                ),
              }
        );
      });
    },
    onSettled: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e) => {
      console.error(e);
      toast.error("Error updating state conditional");
    },
  });

  const stateVariable = stateVariables?.find(
    (v) => v.id === conditional.stateVariableId
  );
  if (!stateVariable) return null;

  function constructConditional() {
    return {
      _id: conditional._id,
      stateVariableId: conditional.stateVariableId,
      comparator,
      value: stateVariable.type === stateTypes.NUMBER ? Number(value) : value,
    };
  }

  function resetFields(e) {
    e.preventDefault();
    setComparator(conditional.comparator);
    setValue(conditional.value);
  }

  const isEditing =
    comparator !== conditional.comparator || value !== conditional.value;

  return (
    <div
      className={`bg-base-300 mt-xs px-[1rem] py-[0.5rem] ${
        isEditing ? "ring-2 ring-grey" : ""
      }`}
    >
      <div>
        <span className="text--1">{stateVariable.name}</span>
        <span className="text-xs ml-2xs text-primary">{`${stateVariable.type} operation`}</span>
      </div>
      <fieldset className="fieldset mt-[0.5rem]">
        <div className="join">
          <SelectInput
            values={validComparators[stateVariable.type]}
            value={comparator}
            onChange={setComparator}
          />
          {stateVariable.type === stateTypes.BOOLEAN ? (
            <SelectInput
              values={[true, false]}
              value={value}
              display={(v) => String(v)}
              onChange={setValue}
            />
          ) : (
            <input
              type={
                stateVariable.type === stateTypes.STRING ? "text" : "number"
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value"
              className="input join-item"
            />
          )}
        </div>
        <div className="ml-auto">
          <button
            className="btn btn-xs btn-phantom"
            onClick={() => deleteConditionalMutation.mutate(conditional._id)}
          >
            Delete
          </button>
          <button className="btn btn-xs btn-phantom" onClick={resetFields}>
            Reset
          </button>
          <button
            className="btn btn-xs btn-phantom"
            onClick={() =>
              updateConditionalMutation.mutate(constructConditional())
            }
          >
            Save
          </button>
        </div>
      </fieldset>
    </div>
  );
};

export default EditStateConditional;
