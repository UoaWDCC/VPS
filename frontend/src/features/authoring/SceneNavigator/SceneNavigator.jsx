import SceneContext from "context/SceneContext";
import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import SceneListItem from "./SceneListItem";
import Thumbnail from "../components/Thumbnail";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { api, handleGeneric } from "../../../util/api";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import useVisualScene from "../stores/visual";
import { PlusIcon } from "lucide-react";

function ThumbOverlay({ scene }) {
  return <Thumbnail components={scene.components} />;
}

// TODO: sort out animation flickering here
const SceneNavigator = () => {
  const { user } = useContext(AuthenticationContext);

  const { scenarioId } = useParams();

  const { scenes, reFetch, reorderScenes } = useContext(SceneContext);
  const activeId = useVisualScene((store) => store.id);

  const [activeIdDragging, setActiveIdDragging] = useState(null);

  async function addScene() {
    api
      .post(user, `/api/scenario/${scenarioId}/scene`, {
        name: `Scene ${scenes.length}`,
      })
      .then(reFetch)
      .catch(handleGeneric);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const sceneIds = scenes.map((s) => s._id);
  const activeIndexDragging = activeIdDragging
    ? sceneIds.indexOf(activeIdDragging)
    : -1;

  function handleDragStart({ active }) {
    setActiveIdDragging(active.id);
  }

  function handleDragEnd({ active, over }) {
    if (!over) return;

    const oldIndex = sceneIds.indexOf(active.id);
    const newIndex = sceneIds.indexOf(over.id);

    if (oldIndex !== newIndex) {
      reorderScenes(arrayMove(sceneIds, oldIndex, newIndex));
    }

    setActiveIdDragging(null);
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <SortableContext items={sceneIds} strategy={verticalListSortingStrategy}>
        <div className="h-full overflow-y-auto no-scrollbar">
          <ul className="flex flex-col gap-s pb-m">
            {scenes.map((scene, index) => (
              <SceneListItem
                scene={scene}
                index={index}
                key={scene._id}
                active={scene._id === activeId}
              />
            ))}
            <div className="w-full">
              <button className="float-right" onClick={addScene}>
                <div className="text-primary hover:text-secondary w-[160px] h-[94px] border-3 border-primary hover:border-secondary rounded-sm flex justify-center items-center">
                  <PlusIcon />
                </div>
              </button>
            </div>
          </ul>
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeIdDragging ? (
          <ThumbOverlay
            scene={scenes[activeIndexDragging]}
            sceneIds={sceneIds}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SceneNavigator;
