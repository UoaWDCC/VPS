import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./SceneNavigator.module.scss";

const SceneListItem = ({ sceneId, thumbnail }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sceneId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <li
      key={sceneId}
      ref={setNodeRef}
      style={style}
      className={styles.sceneListItem}
      {...attributes}
    >
      <div className={styles.dragHandle} {...listeners}>
        <span className={styles.dragIcon}>≡</span>
      </div>
      {thumbnail}
    </li>
  );
};

export default SceneListItem;
