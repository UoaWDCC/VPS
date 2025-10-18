import { useContext } from "react";
import AuthenticationContext from "./AuthenticationContext";
import ScenarioContext from "./ScenarioContext";
import SceneContext from "./SceneContext";
import { useParams } from "react-router-dom";
import { api } from "../util/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingPage from "../features/status/LoadingPage";
import GenericErrorPage from "../features/status/GenericErrorPage";
import toast from "react-hot-toast";
import { parseMedia } from "../firebase/storage";

async function getAllScenes(user, id) {
  const res = await api.get(user, `api/scenario/${id}/scene/all`);
  return res.data.filter(Boolean);
}

function updateScenes(user, id, sceneIds) {
  api.put(user, `/api/scenario/${id}/scene/reorder`, { sceneIds });
}

function deleteScene(user, scenarioId, sceneId) {
  api.delete(user, `/api/scenario/${scenarioId}/scene/${sceneId}`);
}

async function saveScene(user, scenarioId, scene) {
  const components = scene.components;
  const parsed = await parseMedia(components, scenarioId, scene._id);
  await api.put(user, `/api/scenario/${scenarioId}/scene/${scene._id}`, {
    ...scene,
    components: parsed,
  });
}

/**
 * This is a Context Provider made with the React Context API
 * SceneContextProvider allows access to scene info and the refetch function
 */
export default function SceneContextProvider({ children }) {
  const { setCurrentScenario } = useContext(ScenarioContext);
  const { user } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();

  const queryClient = useQueryClient();

  // FIX: this is disgusting
  useQuery({
    queryKey: ["scenario", scenarioId],
    queryFn: () =>
      api.get(user, `api/scenario/${scenarioId}`).then((r) => r.data),
    enabled: !!scenarioId,
    onSuccess: (data) => setCurrentScenario(data),
  });

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
      queryClient.setQueryData(["scenes", scenarioId], (prev) =>
        prev ? prev.filter((s) => s._id !== id) : []
      );
    },
    onError: () => {
      toast.error(
        "Something went wrong updating the scenes, your last changes weren't saved"
      );
    },
  });

  function saveSceneWrapper(scene) {
    scene.components = Object.values(scene.components);
    saveSceneMutation.mutate(scene);
  }

  const saveSceneMutation = useMutation({
    mutationFn: (scene) => saveScene(user, scenarioId, scene),
    onMutate: async (scene) => {
      await queryClient.cancelQueries(["scenes", scenarioId]);
      queryClient.setQueryData(["scenes", scenarioId], (prev = []) => {
        const index = prev.findIndex((s) => s._id === scene._id);
        return index === -1 ? prev : prev.toSpliced(index, 1, scene);
      });
    },
    onError: () => {
      toast.error(
        "Something went wrong updating the scenes, your last changes weren't saved"
      );
    },
  });

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
        reorderScenes: reorderMutation.mutate,
        saveScene: saveSceneWrapper,
        deleteScene: deleteMutation.mutate,
        reFetch: scenesQuery.refetch,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
