import { XIcon } from "lucide-react";
import SelectInput from "../../components/Select";
import useVisualScene from "../../stores/visual";

interface ActionRefRowType {
  onPublish: (actionId: string) => void;
  onScrap: () => void;
}

function ActionRefRowDraft({ onPublish, onScrap }: ActionRefRowType) {
  const actions = useVisualScene((s) => s.actions);

  return (
    <li className="group -mx-5">
      <div className="flex gap-2 items-center px-5 py-0.5">
        <div className="w-6 h-6 flex items-center justify-center touch-none" />
        <SelectInput
          value={null}
          values={actions.map((a) => a.id)}
          display={(id) => actions.find((a) => a.id === id)!.name}
          onChange={onPublish}
          autoFocus={true}
          onBlur={onScrap}
        />
        <button className="btn btn-phantom btn-square btn-xs">
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}

export default ActionRefRowDraft;
