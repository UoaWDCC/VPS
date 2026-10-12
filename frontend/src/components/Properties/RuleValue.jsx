import SelectInput from "../../features/authoring/components/Select";
import { propertyTypes } from "./propertyTypes";

/**
 * The value a destination rule compares a property with: a true/false choice
 * for boolean properties, otherwise a text or number box. Numbers and text are
 * kept as typed until `onCommit`, so a half-typed number isn't saved.
 *
 * @component
 */
const RuleValue = ({ type, value, onChange, onCommit }) => {
  if (type === propertyTypes.BOOLEAN) {
    return (
      <SelectInput
        values={[true, false]}
        value={value}
        display={(v) => String(v)}
        onChange={(v) => {
          onChange(v);
          onCommit?.(v);
        }}
      />
    );
  }

  return (
    <input
      type={type === propertyTypes.STRING ? "text" : "number"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit?.(value)}
      placeholder="Value"
      className="input join-item"
    />
  );
};

export default RuleValue;
