import { useContext } from "react";
import RightContextMenu from "../../../components/ContextMenu/RightContextMenu";
import { api, handleGeneric } from "../../../util/api";
import Thumbnail from "../components/Thumbnail";
import AuthenticationContext from "../../../context/AuthenticationContext";
import SceneContext from "../../../context/SceneContext";
import { useParams, useHistory } from "react-router-dom";
import { applySceneSwitch, saveCurrentScene } from "../scene/scene";
import { handle } from "../../../components/ContextMenu/portal";
import { CopyPlusIcon, Trash2Icon } from "lucide-react";
import type { User } from "firebase/auth";
import type { Scene, Component } from "../types";

type SaveScenePatch = (patch: {
  _id: string;
  fields: Record<string, unknown>;
  components: Component[];
  deletedComponentIds: string[];
}) => Promise<void>;

const SceneMenu = ({
  id,
  canDelete,
  duplicateScene,
  deleteScene,
}: {
  id: string;
  canDelete: boolean;
  duplicateScene: (id: string) => void;
  deleteScene: (id: string) => void;
}) => {
  return (
    <ul className="menu bg-base-200 rounded-box w-fit">
      <li>
        <a onClick={handle(duplicateScene, id)}>
          <CopyPlusIcon size={16} />
          Duplicate
        </a>
      </li>
      <li>
        <a
          className={canDelete ? "" : "pointer-events-none opacity-50"}
          onClick={canDelete ? handle(deleteScene, id) : undefined}
        >
          <Trash2Icon size={16} />
          Delete
        </a>
      </li>
    </ul>
  );
};

function ContextableThumb({
  scene,
  index,
  active,
}: {
  scene: Scene;
  index: number;
  active: boolean;
}) {
  const { user } = useContext(AuthenticationContext) as { user: User };

  const { scenarioId } = useParams<{ scenarioId: string }>();
  const history = useHistory();

  const { scenes, reFetch, saveScenePatch, deleteScene } = useContext(
    SceneContext
  ) as {
    scenes: Scene[];
    reFetch: () => Promise<void>;
    saveScenePatch: SaveScenePatch;
    deleteScene: (id: string) => void;
  };

  const duplicateScene = (id: string): void => {
    void api
      .post(user, `/api/scenario/${scenarioId}/scene/duplicate/${id}`, {})
      .then(reFetch)
      .catch(handleGeneric);
  };

  async function switchScene(s: Scene) {
    if (active) return;

    await saveCurrentScene(saveScenePatch);
    await reFetch();

    applySceneSwitch(s, scenarioId);
    history.push({ pathname: `/scenario/${scenarioId}/scene/${s._id}` });
  }

  return (
    <RightContextMenu
      menu={SceneMenu({
        id: scene._id,
        canDelete: scenes.length > 1,
        deleteScene,
        duplicateScene,
      })}
    >
      <div className="flex">
        {/* if width/margin is increased padding for create thumbnail needs to increased relativly */}
        <p className="w-5.5 text--1 text-right mr-1.5">{index + 1}</p>
        <button
          type="button"
          onMouseDown={() => {
            void switchScene(scene);
          }}
          className="w-[160px] relative rounded-sm overflow-hidden border-3 hover:border-primary"
          style={active ? { border: "3px solid #035084" } : {}}
          key={scene._id}
        >
          <Thumbnail components={scene.components} />
        </button>
      </div>
    </RightContextMenu>
  );
}

export default ContextableThumb;
