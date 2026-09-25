import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api, handleGeneric } from "../../util/api";

async function getSeenResources(user, scenarioId) {
  const res = await api.get(user, `/api/user/seen-resources/${scenarioId}`);
  return res.data.seenResources;
}

async function updateSeenResources(user, scenarioId, operation) {
  const res = await api.patch(
    user,
    `/api/user/seen-resources/${scenarioId}`,
    operation
  );
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
    mutationFn: (operation) => updateSeenResources(user, scenarioId, operation),
    onMutate: async ({ add, remove }) => {
      await queryClient.cancelQueries(queryKey);
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (prev = []) =>
        add
          ? [...new Set([...prev, ...add])]
          : prev.filter((id) => !remove.includes(id))
      );
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
    mutate({ add: [resourceId] });
  };

  const unmarkSeen = (resourceIds) => {
    if (resourceIds.length === 0) return;
    mutate({ remove: resourceIds });
  };

  return {
    seenIds,
    isLoaded: seenQuery.isSuccess,
    markSeen,
    unmarkSeen,
  };
}
