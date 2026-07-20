import { useContext, useState } from "react";
import ScenarioContext from "context/ScenarioContext";
import { getDefaultValue, stateTypes, validComparators } from "./stateTypes";
import SelectInput from "../../features/authoring/components/Select";
import ModalDialog from "../ModalDialogue";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";

/**
 * Component used for creating state conditionals
 * State conditionals are used to check whether state variables meet certain conditions
 *
 * @component
 */
const CreateStateConditional = ({ endpoint, open, setOpen, updateTarget }) => {
  const { user } = useContext(AuthenticationContext);
  const { stateVariables } = useContext(ScenarioContext);

  const [selectedState, setSelectedState] = useState(null);
  const [comparator, setComparator] = useState(null);
  const [value, setValue] = useState(null);

  if (!stateVariables?.length) {
    return (
      <ModalDialog
        title="Create State Conditional"
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="text-xs">
          No state variables found, create some in the state variable menu
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
    // Validate that all required fields are filled
    if (!selectedState?.id || !comparator) return;

    const stateConditional = {
      stateVariableId: selectedState.id,
      comparator,
      value: selectedState.type === stateTypes.NUMBER ? Number(value) : value,
    };

    api
      .post(user, endpoint, {
        stateConditional,
      })
      .then((res) => {
        updateTarget(res.data);
        setSelectedState(null);
        setComparator(null);
        setValue(null);
        setOpen(false);
        toast.success("State conditional created!");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error creating state conditional");
      });
  };

  function onVariableChange(variable) {
    setSelectedState(variable);
    setValue(getDefaultValue(variable.type));
    setComparator("=");
  }

  const isSubmittable = selectedState && comparator && value != null;

  return (
    <ModalDialog
      title="Create State Conditional"
      open={open}
      onClose={() => setOpen(false)}
    >
      <fieldset className="fieldset">
        <label className="label">State Variable</label>
        <SelectInput
          values={stateVariables}
          value={selectedState}
          display={(s) => s.name}
          onChange={onVariableChange}
        />
        {selectedState ? (
          <>
            <label className="label">Comparator</label>
            <div className="join">
              <SelectInput
                values={validComparators[selectedState.type]}
                value={comparator}
                onChange={setComparator}
              />
              {selectedState.type === stateTypes.BOOLEAN ? (
                <SelectInput
                  values={[true, false]}
                  value={value}
                  display={(v) => String(v)}
                  onChange={setValue}
                />
              ) : (
                <input
                  type={
                    selectedState.type === stateTypes.STRING ? "text" : "number"
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

export default CreateStateConditional;
