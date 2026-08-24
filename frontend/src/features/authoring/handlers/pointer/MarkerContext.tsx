import { Ban, List, Minus, SquareCheck } from "lucide-react";
import { handle } from "../../../../components/ContextMenu/portal";
import { setBlockListStyle } from "../../scene/operations/text";
import useEditorStore from "../../stores/editor";
import type { ListMarkerStyle } from "../../types";

// mirrors handleMarkerSelectionKey's Backspace/Delete behaviour: removing
// the list entirely invalidates the marker selection's blocks, so it must
// be cleared here too -- otherwise it goes stale and swallows the next
// Backspace/Delete as a no-op instead of deleting the selected component
function applyMarkerStyle(
  id: string,
  range: { start: number; end: number },
  value: ListMarkerStyle | "none"
) {
  setBlockListStyle([id], range, value);
  if (value === "none") useEditorStore.getState().setMarkerSelection(null);
}

const OPTIONS: {
  value: ListMarkerStyle | "none";
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "dash", label: "Dash", icon: <Minus size={16} /> },
  { value: "bullet", label: "Bullet", icon: <List size={16} /> },
  { value: "checkbox", label: "Checkbox", icon: <SquareCheck size={16} /> },
  { value: "none", label: "Remove bullets", icon: <Ban size={16} /> },
];

const MarkerMenu = ({
  id,
  start,
  end,
}: {
  id: string;
  start: number;
  end: number;
}) => {
  return (
    <ul className="menu bg-base-200 rounded-box w-fit">
      {OPTIONS.map((option) => (
        <li key={option.value}>
          <a
            onClick={handle(applyMarkerStyle, id, { start, end }, option.value)}
          >
            {option.icon}
            {option.label}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default MarkerMenu;
