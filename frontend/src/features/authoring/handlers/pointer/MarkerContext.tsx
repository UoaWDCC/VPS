import { Ban, List, Minus, SquareCheck } from "lucide-react";
import { handle } from "../../../../components/ContextMenu/portal";
import { setBlockListStyle } from "../../scene/operations/text";
import type { ListMarkerStyle } from "../../types";

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
            onClick={handle(
              setBlockListStyle,
              [id],
              { start, end },
              option.value
            )}
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
