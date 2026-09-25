import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api, handleGeneric } from "../../util/api";

async function getSeenResources(user, scenarioId) {
  const res = await api.get(user, `/api/user/seen-resources/${scenarioId}`);
  return res.data.seenResources;
}

async function addSeenResources(user, scenarioId, resourceIds) {
  const res = await api.patch(user, `/api/user/seen-resources/${scenarioId}`, {
    resourceIds,
  });
  return res.data.seenResources;
}

export function useSeenResources() {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);
  const queryClient = useQueryClient();
  const queryKey = ["seenResources", user.uid, scenarioId];

  const seenQuery = useQuery({
    queryKey,
    queryFn: () => getSeenResources(user, scenarioId),
  });

  const { mutate } = useMutation({
    mutationFn: (resourceId) =>
      addSeenResources(user, scenarioId, [resourceId]),
    onMutate: async (resourceId) => {
      await queryClient.cancelQueries(queryKey);
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (prev = []) => [...prev, resourceId]);
      return { previous };
    },
    onError: (e, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      handleGeneric(e);
    },
    onSettled: () => queryClient.invalidateQueries(queryKey),
  });

  const seenIds = seenQuery.data ?? [];

  const markSeen = (resourceId) => {
    if (seenIds.includes(resourceId)) return;
    mutate(resourceId);
  };

  return {
    seenIds,
    isLoaded: seenQuery.isSuccess,
    markSeen,
  };
}
