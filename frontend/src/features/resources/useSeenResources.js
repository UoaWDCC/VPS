import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
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
  const seenKey = ["seenResources", user.uid, scenarioId];

  //ids seen this session separate from fetched history, merged on read
  //this way a fetch that started before a save cannot drop it
  const [markedIds, setMarkedIds] = useState([]);

  const seenQuery = useQuery({
    queryKey: seenKey,
    queryFn: () => getSeenResources(user, scenarioId),
    onError: (e) => {
      console.error(e);
      toast.error("Couldn't load new resource notifications");
    },
  });

  const { mutate } = useMutation({
    mutationFn: (resourceId) =>
      addSeenResources(user, scenarioId, [resourceId]),
    onSuccess: async (serverSeen) => {
      await queryClient.cancelQueries({ queryKey: seenKey });
      queryClient.setQueryData(seenKey, (old) => [
        ...new Set([...(old ?? []), ...serverSeen]),
      ]);
    },
    onError: (e, resourceId) => {
      setMarkedIds((prev) => prev.filter((id) => id !== resourceId));
      handleGeneric(e);
    },
  });

  const seenIds = useMemo(
    () => [...new Set([...(seenQuery.data ?? []), ...markedIds])],
    [seenQuery.data, markedIds]
  );

  const markSeen = (resourceId) => {
    if (seenIds.includes(resourceId)) return;
    setMarkedIds((prev) => [...prev, resourceId]);
    mutate(resourceId);
  };

  return {
    seenIds,
    //a failed refetch keeps the last history, so don't hide indicators
    isLoaded: seenQuery.data !== undefined,
    markSeen,
  };
}
