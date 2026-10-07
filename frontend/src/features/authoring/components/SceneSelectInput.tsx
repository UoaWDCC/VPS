import type { Scene } from "../types";
import SelectInput from "./Select";

interface SceneSelectInputProps {
  scenes: Scene[];
  value: string | null;
  exclusionId?: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  error?: boolean;
}

function SceneSelectInput({
  scenes,
  exclusionId,
  value,
  onChange,
  error,
}: SceneSelectInputProps) {
  return (
    <SelectInput
      nullable
      value={value}
      values={
        scenes
          ?.filter((scene) => scene._id !== exclusionId)
          .map((scene) => scene._id) ?? []
      }
      display={(targetId) =>
        scenes?.find((scene) => scene._id === targetId)?.name ?? "Deleted Scene"
      }
      onChange={onChange}
      error={error}
    />
  );
}

export default SceneSelectInput;
