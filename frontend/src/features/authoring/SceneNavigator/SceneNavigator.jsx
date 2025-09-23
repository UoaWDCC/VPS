import SceneContext from "context/SceneContext";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styles from "./SceneNavigator.module.scss";
import SceneListItem from "./SceneListItem";
import Thumbnail from "../components/Thumbnail";
import RightContextMenu from "../../../components/ContextMenu/RightContextMenu";
import { MenuItem, MenuList, Paper } from "@material-ui/core";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { handle } from "../../../components/ContextMenu/portal";
import { api, handleGeneric } from "../../../util/api";
import DashedCard from "../../../components/DashedCard";
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
import { arrayToObject } from "../scene/util";
import useEditorStore from "../stores/editor";
import { replace } from "../scene/operations/modifiers";
import { getScene } from "../scene/scene";
import useVisualScene from "../stores/visual";

const SceneMenu = ({ id, duplicateScene, deleteScene }) => {
  return (
    <Paper>
      <MenuList>
        <MenuItem onClick={handle(duplicateScene, id)}>Duplicate 123</MenuItem>
        <MenuItem onClick={handle(deleteScene, id)}>Delete</MenuItem>
      </MenuList>
    </Paper>
  );
};

const SceneNavigator = () => {
  const { user } = useContext(AuthenticationContext);
  const { scenes, saveScene, reFetch, reorderScenes, deleteScene } = useContext(SceneContext);

  const activeScene = useVisualScene(store => store.id);

  const { scenarioId } = useParams();
  const history = useHistory();

  const [thumbnails, setThumbnails] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [dropIndicator, setDropIndicator] = useState({
    show: false,
    index: -1,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const duplicateScene = async (id) => {
    api
      .post(user, `/api/scenario/${scenarioId}/scene/duplicate/${id}`, {})
      .then(reFetch)
      .catch(handleGeneric);
  };

  const addScene = async () => {
    api
      .post(user, `/api/scenario/${scenarioId}/scene`, {
        name: `Scene ${scenes.length}`,
      })
      .then(reFetch)
      .catch(handleGeneric);
  };

  const updateSceneOrder = (reordered) => {
    reorderScenes(reordered);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) {
      setDropIndicator({ show: false, index: -1 });
      return;
    }

    if (active.id !== over.id) {
      const activeIndex = scenes.findIndex((scene) => scene._id === active.id);
      const overIndex = scenes.findIndex((scene) => scene._id === over.id);

      let indicatorIndex = overIndex;

      if (activeIndex < overIndex) indicatorIndex = overIndex;
      else if (activeIndex > overIndex) indicatorIndex = overIndex;

      setDropIndicator({ show: true, index: indicatorIndex });
    } else {
      setDropIndicator({ show: false, index: -1 });
    }
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    setDropIndicator({ show: false, index: -1 });

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeIndex = scenes.findIndex((scene) => scene._id === active.id);
    const overIndex = scenes.findIndex((scene) => scene._id === over.id);

    if (activeIndex === overIndex) return;

    const reordered = arrayMove(scenes.map(s => s._id), activeIndex, overIndex);
    updateSceneOrder(reordered);
  };

  function switchScene(scene) {
    if (scene._id === activeScene) return;

    saveScene(structuredClone(getScene()));
    useEditorStore.getState().clear();
    replace(scene);

    const pathname = `/scenario/${scenarioId}/scene/${scene._id}`;
    history.push({ pathname });
  }

  function ThumbWrapper({ scene, index }) {
    const isActive = scene._id === activeScene;
    return (
      <RightContextMenu
        menu={SceneMenu({
          id: scene._id,
          deleteScene,
          duplicateScene,
        })}
      >
        <div className="flex items-center gap-2.5">
          <p className="w-4">{index + 1}</p>
          <button
            type="button"
            onClick={() => switchScene(scene)}
            className={styles.sceneButton}
            style={isActive ? { border: "3px solid #035084" } : null}
            key={scene._id}
          >
            <Thumbnail components={scene.components} />
          </button>
        </div>
      </RightContextMenu>
    )
  }

  useEffect(() => {
    if (!scenes?.length) return;

    const thumbs = scenes.map((scene, index) => ({
      sceneId: scene._id,
      item: <ThumbWrapper scene={scene} index={index} />,
    }));

    setThumbnails(thumbs);
  }, [scenes, activeScene]);

  return (
    thumbnails && (
      <div className="flex relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={scenes.map((scene) => scene._id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className={styles.sceneNavigator}>
              {thumbnails.map(
                ({ sceneId, item }, index) => (
                  <React.Fragment key={`scene-item-${sceneId}`}>
                    {dropIndicator.show && dropIndicator.index === index && (
                      <div className={styles.dropIndicator} />
                    )}
                    <SceneListItem
                      thumbnail={item}
                      sceneId={sceneId}
                      key={sceneId}
                    />
                  </React.Fragment>
                )
              )}
              {dropIndicator.show && dropIndicator.index === scenes.length && (
                <div className={styles.dropIndicator} />
              )}
              <div className="w-full pl-6.5">
                <DashedCard height={94} onClick={addScene} />
              </div>
            </ul>
          </SortableContext>

          <DragOverlay>
            {activeId && thumbnails.find((t) => t.sceneId === activeId) && (
              <div className={styles.sceneListItem} style={{ opacity: 0.8 }}>
                {thumbnails.find((t) => t.sceneId === activeId).sceneListItem}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    )
  );
};

export default SceneNavigator;
