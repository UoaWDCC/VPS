import type { Scene } from "../types";
import SelectInput from "./Select";

interface SceneSelectInputProps {
  scenes: Scene[];
  value: string | null;
  exclusionId: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}

function SceneSelectInput({ scenes, exclusionId, value, onChange }: SceneSelectInputProps) {
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
        scenes?.find((scene) => scene._id === targetId)?.name ??
        "Unknown scene"
      }
      onChange={onChange}
    />
  )
}

export default SceneSelectInput;
