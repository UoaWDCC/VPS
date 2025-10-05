import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./SceneNavigator.module.scss";
import ContextableThumb from "./ContextableThumb";

const SceneListItem = ({ scene, index, active }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    transition,
  } = useSortable({ id: scene._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.1 : 1,
  };

  return (
    <li
      style={style}
      className={styles.sceneListItem}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
    >
      <ContextableThumb scene={scene} index={index} active={active} />
    </li>
  );
};

export default SceneListItem;
