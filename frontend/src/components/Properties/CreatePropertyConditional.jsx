import { useContext, useState } from "react";
import ScenarioContext from "context/ScenarioContext";
import {
  getDefaultValue,
  propertyTypes,
  validComparators,
} from "./propertyTypes";
import SelectInput from "../../features/authoring/components/Select";
import ModalDialog from "../ModalDialogue";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

function createPropertyConditional(user, scenarioId, resourceId, conditional) {
  return api.post(
    user,
    `api/resources/${scenarioId}/${resourceId}/conditionals`,
    { propertyConditional: conditional }
  );
}

/**
 * Component used for creating property conditionals
 * Property conditionals are used to check whether properties meet certain conditions
 *
 * @component
 */
const CreatePropertyConditional = ({ resource, open, setOpen }) => {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);
  const { properties } = useContext(ScenarioContext);

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [comparator, setComparator] = useState(null);
  const [value, setValue] = useState(null);

  const queryClient = useQueryClient();

  const createConditionalMutation = useMutation({
    mutationFn: (conditional) =>
      createPropertyConditional(user, scenarioId, resource._id, conditional),
    onSettled: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e) => {
      console.error(e);
      toast.error("Error creating property conditional");
    },
    onSuccess: () => {
      setSelectedProperty(null);
      setComparator(null);
      setValue(null);
      setOpen(false);
      toast.success("Property conditional created!");
    },
  });

  if (!properties?.length) {
    return (
      <ModalDialog
        title="Create Property Conditional"
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="text-xs">
          No properties found, create some in the Properties menu
        </div>
        <div className="modal-action">
          <button className="btn" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </ModalDialog>
    );
  }

  const handleSubmit = () => {
    if (!selectedProperty?.id || !comparator) return;

    createConditionalMutation.mutate({
      stateVariableId: selectedProperty.id,
      comparator,
      value:
        selectedProperty.type === propertyTypes.NUMBER ? Number(value) : value,
    });
  };

  function onPropertyChange(property) {
    setSelectedProperty(property);
    setValue(getDefaultValue(property.type));
    setComparator("=");
  }

  const isSubmittable = selectedProperty && comparator && value != null;

  return (
    <ModalDialog
      title="Create Property Conditional"
      open={open}
      onClose={() => {
        setSelectedProperty(null);
        setComparator(null);
        setValue(null);
        setOpen(false);
      }}
    >
      <fieldset className="fieldset">
        <label className="label">Property</label>
        <SelectInput
          values={properties}
          value={selectedProperty}
          display={(p) => p.name}
          onChange={onPropertyChange}
        />
        {selectedProperty ? (
          <>
            <label className="label">Comparator</label>
            <div className="join">
              <SelectInput
                values={validComparators[selectedProperty.type]}
                value={comparator}
                onChange={setComparator}
              />
              {selectedProperty.type === propertyTypes.BOOLEAN ? (
                <SelectInput
                  values={[true, false]}
                  value={value}
                  display={(v) => String(v)}
                  onChange={setValue}
                />
              ) : (
                <input
                  type={
                    selectedProperty.type === propertyTypes.STRING
                      ? "text"
                      : "number"
                  }
                  value={value ?? ""}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Value"
                  className="input join-item"
                />
              )}
            </div>
          </>
        ) : null}
      </fieldset>
      <div className="modal-action flex gap-2">
        <button
          className={`btn ${!isSubmittable && "btn-disabled"}`}
          onClick={handleSubmit}
        >
          Create
        </button>
      </div>
    </ModalDialog>
  );
};

export default CreatePropertyConditional;
