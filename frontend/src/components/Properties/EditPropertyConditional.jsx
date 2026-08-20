import { useContext, useEffect, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import SelectInput from "../../features/authoring/components/Select";
import { propertyTypes, validComparators } from "./propertyTypes";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api } from "../../util/api";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

function deletePropertyConditional(
  user,
  scenarioId,
  resourceId,
  conditionalId
) {
  return api.delete(
    user,
    `api/resources/${scenarioId}/${resourceId}/conditionals/${conditionalId}`
  );
}

function editPropertyConditional(user, scenarioId, resourceId, conditional) {
  return api.put(
    user,
    `api/resources/${scenarioId}/${resourceId}/conditionals`,
    { propertyConditional: conditional }
  );
}

/**
 * Component used for editing property conditionals
 *
 * @component
 */
const EditPropertyConditional = ({ resource, conditional }) => {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);
  const { properties } = useContext(ScenarioContext);

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
      deletePropertyConditional(user, scenarioId, resource._id, conditionalId),
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
      toast.error("Error deleting property conditional");
    },
  });

  const updateConditionalMutation = useMutation({
    mutationFn: (conditional) =>
      editPropertyConditional(user, scenarioId, resource._id, conditional),
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
      toast.error("Error updating property conditional");
    },
  });

  const property = properties?.find(
    (p) => p.id === conditional.stateVariableId
  );
  if (!property) return null;

  function constructConditional() {
    return {
      _id: conditional._id,
      stateVariableId: conditional.stateVariableId,
      comparator,
      value: property.type === propertyTypes.NUMBER ? Number(value) : value,
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
        <span className="text--1">{property.name}</span>
        <span className="text-xs ml-2xs text-primary">{`${property.type} operation`}</span>
      </div>
      <fieldset className="fieldset mt-[0.5rem]">
        <div className="join">
          <SelectInput
            values={validComparators[property.type]}
            value={comparator}
            onChange={setComparator}
          />
          {property.type === propertyTypes.BOOLEAN ? (
            <SelectInput
              values={[true, false]}
              value={value}
              display={(v) => String(v)}
              onChange={setValue}
            />
          ) : (
            <input
              type={property.type === propertyTypes.STRING ? "text" : "number"}
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

export default EditPropertyConditional;
