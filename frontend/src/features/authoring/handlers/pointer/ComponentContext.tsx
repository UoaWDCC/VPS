import {
  BringToFrontIcon,
  CopyPlusIcon,
  SendToBackIcon,
  Trash2Icon,
} from "lucide-react";
import { handle } from "../../../../components/ContextMenu/portal";
import { remove } from "../../scene/operations/modifiers";
import {
  bringForward,
  bringToFront,
  duplicateComponent,
  sendBackward,
  sendToBack,
} from "../../scene/operations/component";
import useEditorStore from "../../stores/editor";

const ComponentMenu = (ids: string[]) => {
  function removeAndDeselect(selectedIds: string[]) {
    remove(selectedIds);
    useEditorStore.getState().setSelected([]);
  }

  return (
    <ul className="menu bg-base-200 rounded-box w-fit">
      <li>
        <a onClick={handle(duplicateComponent, ids)}>
          <CopyPlusIcon size={16} />
          Duplicate
        </a>
      </li>
      <li>
        <a onClick={handle(removeAndDeselect, ids)}>
          <Trash2Icon size={16} />
          Delete
        </a>
      </li>
      <div className="divider m-0" />
      <li>
        <a onClick={handle(bringForward, ids)}>
          <BringToFrontIcon size={16} />
          Bring Forward
        </a>
      </li>
      <li>
        <a onClick={handle(bringToFront, ids)}>
          <BringToFrontIcon size={16} />
          Bring to Front
        </a>
      </li>
      <li>
        <a onClick={handle(sendBackward, ids)}>
          <SendToBackIcon size={16} />
          Send Backward
        </a>
      </li>
      <li>
        <a onClick={handle(sendToBack, ids)}>
          <SendToBackIcon size={16} />
          Send to Back
        </a>
      </li>
    </ul>
  );
};

export default ComponentMenu;
