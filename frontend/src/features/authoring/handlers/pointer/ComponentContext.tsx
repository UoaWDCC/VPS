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

const ComponentMenu = ({ id }: { id: string }) => {
  return (
    <ul className="menu bg-base-200 rounded-box w-fit">
      <li>
        <a onClick={handle(duplicateComponent, id)}>
          <CopyPlusIcon size={16} />
          Duplicate
        </a>
      </li>
      <li>
        <a onClick={handle(remove, id)}>
          <Trash2Icon size={16} />
          Delete
        </a>
      </li>
      <div className="divider m-0" />
      <li>
        <a onClick={handle(bringForward, id)}>
          <BringToFrontIcon size={16} />
          Bring Forward
        </a>
      </li>
      <li>
        <a onClick={handle(bringToFront, id)}>
          <BringToFrontIcon size={16} />
          Bring to Front
        </a>
      </li>
      <li>
        <a onClick={handle(sendBackward, id)}>
          <SendToBackIcon size={16} />
          Send Backward
        </a>
      </li>
      <li>
        <a onClick={handle(sendToBack, id)}>
          <SendToBackIcon size={16} />
          Send to Back
        </a>
      </li>
    </ul>
  );
};

export default ComponentMenu;
