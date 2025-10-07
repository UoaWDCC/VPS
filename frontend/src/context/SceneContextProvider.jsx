import { useContext, useEffect, useRef, useState } from "react";
import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import AuthenticationContext from "./AuthenticationContext";
import ScenarioContext from "./ScenarioContext";
import SceneContext from "./SceneContext";
import { useParams } from "react-router-dom";
import { api } from "../util/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingPage from "../features/status/LoadingPage";
import GenericErrorPage from "../features/status/GenericErrorPage";
import toast from "react-hot-toast";
import useVisualScene from "../features/authoring/stores/visual";
import { getScene } from "../features/authoring/scene/scene";

async function getAllScenes(user, id) {
  const res = await api.get(user, `api/scenario/${id}/scene/all`)
  return res.data.filter(Boolean);
}

function updateScenes(user, id, sceneIds) {
  api.put(
    user,
    `/api/scenario/${id}/scene/reorder`,
    { sceneIds });
}

function deleteScene(user, scenarioId, sceneId) {
  api.delete(user, `/api/scenario/${scenarioId}/scene/${sceneId}`);
};

async function saveScene(user, scenarioId, scene) {
  const components = Object.values(scene.components);
  await api.put(user, `/api/scenario/${scenarioId}/scene/${scene._id}`, { ...scene, components });
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

  // TODO: this is disgusting
  const scenarioQuery = useQuery({
    queryKey: ["scenario", scenarioId],
    queryFn: () => api.get(user, `api/scenario/${scenarioId}`).then(r => r.data),
    enabled: !!scenarioId,
    onSuccess: (data) => setCurrentScenario(data),
  });

  const scenesQuery = useQuery({
    queryKey: ["scenes", scenarioId],
    queryFn: () => getAllScenes(user, scenarioId),
    enabled: !!scenarioId
  });

  const reorderMutation = useMutation({
    mutationFn: (ids) => updateScenes(user, scenarioId, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries(["scenes", scenarioId]);
      queryClient.setQueryData(["scenes", scenarioId], (prev = []) => {
        return ids.map(id => prev.find(s => s._id === id));
      });
    },
    onError: (_err, _updates, context) => {
      toast.error("Something went wrong updating the scenes, your last changes weren't saved");
    },
    onSettled: () => {
      // queryClient.invalidateQueries(["scenes", scenarioId]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteScene(user, scenarioId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(["scenes", scenarioId]);
      queryClient.setQueryData(["scenes", scenarioId], prev => prev ? prev.filter(s => s._id !== id) : []);
    },
    onError: (_err, _updates, context) => {
      toast.error("Something went wrong updating the scenes, your last changes weren't saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries(["scenes", scenarioId]);
    }
  });

  const saveSceneMutation = useMutation({
    mutationFn: (scene) => saveScene(user, scenarioId, scene),
    onMutate: async (scene) => {
      await queryClient.cancelQueries(["scenes", scenarioId]);
      queryClient.setQueryData(["scenes", scenarioId], (prev = []) => {
        const index = prev.findIndex(s => s._id === scene._id);
        return index === -1 ? prev : prev.toSpliced(index, 1, scene);
      })
    },
    onError: (_err, _updates, context) => {
      toast.error("Something went wrong updating the scenes, your last changes weren't saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries(["scenes", scenarioId]);
    }
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
        saveScene: saveSceneMutation.mutate,
        deleteScene: deleteMutation.mutate,
        reFetch: scenesQuery.refetch,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
