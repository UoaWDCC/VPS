import { useCallback, useContext } from "react";
import AuthenticationContext from "./AuthenticationContext";
import SceneContext from "./SceneContext";
import { useParams, useHistory } from "react-router-dom";
import { api } from "../util/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingPage from "../features/status/LoadingPage";
import GenericErrorPage from "../features/status/GenericErrorPage";
import toast from "react-hot-toast";
import { parseMedia } from "../firebase/storage";
import useEditorStore from "../features/authoring/stores/editor";
import { replace } from "../features/authoring/scene/operations/modifiers";

async function getAllScenes(user, id) {
  const res = await api.get(user, `api/scenario/${id}/scene/all`);
  return res.data.filter(Boolean);
}

function updateScenes(user, id, sceneIds) {
  return api.put(user, `/api/scenario/${id}/scene/reorder`, { sceneIds });
}

function deleteScene(user, scenarioId, sceneId) {
  return api.delete(user, `/api/scenario/${scenarioId}/scene/${sceneId}`);
}

async function modifyScene(user, scenarioId, patch) {
  const parsedComponents = await parseMedia(
    patch.components,
    scenarioId,
    patch._id
  );

  await api.patch(user, `/api/scenario/${scenarioId}/scene/${patch._id}`, {
    fields: patch.fields,
    components: parsedComponents,
    deletedComponentIds: patch.deletedComponentIds,
  });
}

function generatePatch(modified, saved) {
  const components = [];
  const deletedComponentIds = [];
  const fields = {};

  const currentComponents = modified.components ?? {};
  const savedComponents = saved.components ?? [];

  Object.entries(currentComponents).forEach(([id, component]) => {
    if (
      JSON.stringify(component) !==
      JSON.stringify(savedComponents.find((c) => c.id === id))
    ) {
      components.push(structuredClone(component));
    }
  });

  savedComponents.forEach((c) => {
    if (!currentComponents[c.id]) deletedComponentIds.push(c.id);
  });

  ["name", "roles", "time", "directLink", "timerStateOperations"].forEach(
    (field) => {
      if (JSON.stringify(modified[field]) !== JSON.stringify(saved[field])) {
        fields[field] = structuredClone(modified[field]);
      }
    }
  );

  return {
    _id: modified._id,
    fields,
    components,
    deletedComponentIds,
  };
}

function applyPatch(scene, patch) {
  const { fields = {}, components = [], deletedComponentIds = [] } = patch;

  const updated = [];
  const seen = new Set();

  for (const c of scene.components) {
    if (deletedComponentIds.includes(c.id)) continue;
    updated.push(components.find((uc) => uc.id === c.id) ?? c);
    seen.add(c.id);
  }

  for (const c of components) {
    if (!seen.has(c.id)) updated.push(c);
  }

  return { ...scene, ...fields, components: updated };
}

/**
 * This is a Context Provider made with the React Context API
 * SceneContextProvider allows access to scene info and the refetch function
 */
export default function SceneContextProvider({ children }) {
  const { user } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();
  const history = useHistory();

  const queryClient = useQueryClient();

  const scenesQuery = useQuery({
    queryKey: ["scenes", scenarioId],
    queryFn: () => getAllScenes(user, scenarioId),
    enabled: !!scenarioId,
  });

  const reorderMutation = useMutation({
    mutationFn: (ids) => updateScenes(user, scenarioId, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries(["scenes", scenarioId]);
      queryClient.setQueryData(["scenes", scenarioId], (prev = []) => {
        return ids.map((id) => prev.find((s) => s._id === id));
      });
    },
    onError: () => {
      toast.error(
        "Something went wrong updating the scenes, your last changes weren't saved"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteScene(user, scenarioId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(["scenes", scenarioId]);
      const previousScenes = queryClient.getQueryData(["scenes", scenarioId]);

      queryClient.setQueryData(["scenes", scenarioId], (prev) =>
        prev ? prev.filter((s) => s._id !== id) : []
      );

      return { previousScenes };
    },
    onError: (error, _id, context) => {
      if (context?.previousScenes) {
        queryClient.setQueryData(
          ["scenes", scenarioId],
          context.previousScenes
        );
      }

      toast.error(
        error?.response?.data?.error ||
        "Something went wrong updating the scenes, your last changes weren't saved"
      );
    },
  });

  const modifyMutation = useMutation({
    mutationFn: (patch) => modifyScene(user, scenarioId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries(["scenes", scenarioId]);
      const previousScenes = queryClient.getQueryData(["scenes", scenarioId]);
      const previousScene = previousScenes.find((s) => s._id === patch._id);

      queryClient.setQueryData(["scenes", scenarioId], (prev) => {
        return prev.map((s) =>
          s._id === patch._id ? applyPatch(s, patch) : s
        );
      });

      return { previousScene };
    },
    // NOTE: on failure, the changes are wiped from the scenes context, but NOT the active scene,
    // which means on the next save the changes will be retried. 
    // However, if its a save triggered by a switch, then those changes are fully gone. A proper failure
    // handler needs to be developed to prefer retry over rollback.
    onError: (error, _id, context) => {
      const previousScene = context?.previousScene;
      if (previousScene) {
        queryClient.setQueryData(["scenes", scenarioId], (prev) => {
          return prev.map((s) =>
            s._id === previousScene._id ? previousScene : s
          );
        });
      }

      toast.error(
        "Something went wrong modifying the scene, your last changes weren't saved"
      );
    },
  });

  const modifyMutationWrapper = useCallback(
    (scene) => {
      const saved = scenesQuery.data?.find((s) => s._id === scene._id);
      if (!saved) {
        console.warn("scene not found in cache, skipping save");
        return;
      }
      return modifyMutation.mutateAsync(generatePatch(scene, saved));
    },
    [scenesQuery.data]
  );

  const switchScene = useCallback(
    (scene, id) => {
      if (scene._id === id) return; // switch to same scene is a no-op
      modifyMutationWrapper(scene);
      const target = scenesQuery.data?.find((s) => s._id === id);
      if (!target) {
        console.warn("target scene for switch not found");
        return;
      }
      useEditorStore.getState().clear();
      replace(target);
      history.push({ pathname: `/scenario/${scenarioId}/scene/${id}` });
      localStorage.setItem(`${scenarioId}:activeScene`, id);
    },
    [scenesQuery.data, modifyMutationWrapper]
  );

  if (scenesQuery.isLoading) {
    return <LoadingPage text="Getting scenes..." />;
  }

  if (scenesQuery.isError) {
    console.error(scenesQuery.error);
    return <GenericErrorPage />;
  }

  return (
    <SceneContext.Provider
      value={{
        scenes: scenesQuery.data,
        reFetch: scenesQuery.refetch,
        reorderScenes: reorderMutation.mutate,
        deleteScene: deleteMutation.mutate,
        modifyScene: modifyMutationWrapper,
        switchScene,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
