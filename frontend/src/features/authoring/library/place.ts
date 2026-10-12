import type { QueryClient } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import type { User } from "firebase/auth";
import toast from "react-hot-toast";
import { v4 } from "uuid";
import { api } from "../../../util/api";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../util/canvas";
import { addImageToScene, type ModifyScene } from "../images";
import { getNextZIndex } from "../scene/operations/component";
import { add } from "../scene/operations/modifiers";
import { getScene, getSceneId } from "../scene/scene";
import useEditorStore from "../stores/editor";
import type { UploadedFile } from "../types";
import { buttonComponent } from "./buttonComponent.js";
import type { LibraryItem, UploadItem } from "./items.js";

export interface PlaceContext {
  user: User;
  scenarioId: string;
  modifyScene: ModifyScene;
  queryClient: QueryClient;
}

function select(id: string) {
  useEditorStore.getState().setSelected([id]);
}

/**
 * The scenario's own file for an upload: the first use in a scenario makes it
 * (pointing at the same stored object), after that it's the same file again.
 * It's what scenes reference, so reference counting works as for any upload.
 */
async function fileForScenario(item: UploadItem, ctx: PlaceContext) {
  const response = (await api.post(
    ctx.user,
    `api/assets/${item.asset._id}/use`,
    { scenarioId: ctx.scenarioId }
  )) as AxiosResponse<UploadedFile>;
  return response.data;
}

/**
 * Puts a library item into the scene being edited (or, for a document, into
 * the scenario's resources). Whatever lands on the canvas ends up selected, so
 * the author can carry straight on editing it.
 */
export async function placeItem(item: LibraryItem, ctx: PlaceContext) {
  if (item.source === "preset") {
    switch (item.kind) {
      case "button": {
        const id = v4();
        add(
          buttonComponent(item, {
            id,
            zIndex: getNextZIndex(),
            canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
          })
        );
        select(id);
        return;
      }
      case "image": {
        const originScene = getScene();
        const id = await addImageToScene(
          { url: item.url },
          originScene,
          ctx.modifyScene
        );
        // the author may have moved to another slide while it loaded
        if (getSceneId() === originScene._id) select(id);
        return;
      }
      case "audio":
        add({
          type: "audio",
          name: item.name,
          url: item.url,
          loop: item.loops,
        });
        toast.success(`Added "${item.name}" to this scene`);
        return;
    }
  }

  const file = await fileForScenario(item, ctx);

  switch (item.kind) {
    case "image": {
      const originScene = getScene();
      const id = await addImageToScene(file, originScene, ctx.modifyScene);
      if (getSceneId() === originScene._id) select(id);
      void ctx.queryClient.invalidateQueries({
        queryKey: ["images", ctx.scenarioId],
      });
      return;
    }
    case "audio":
      add({
        fileId: file._id,
        type: "audio",
        name: file.name,
        url: file.url,
        loop: false,
      });
      void ctx.queryClient.invalidateQueries({
        queryKey: ["audios", ctx.scenarioId],
      });
      toast.success(`Added "${file.name}" to this scene`);
      return;
    case "document":
      await api.post(ctx.user, `api/resources/${ctx.scenarioId}`, {
        name: file.name,
        fileId: file._id,
      });
      void ctx.queryClient.invalidateQueries({
        queryKey: ["resources", ctx.scenarioId],
      });
      toast.success(`Added "${file.name}" to this scenario's resources`);
      return;
  }
}
