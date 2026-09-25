import { useMutation, useQuery } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
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

  //ids seen this session separate from fetched history, merged on read
  //this way a fetch that started before a save cannot drop it
  const [markedIds, setMarkedIds] = useState([]);

  const seenQuery = useQuery({
    queryKey: ["seenResources", user.uid, scenarioId],
    queryFn: () => getSeenResources(user, scenarioId),
  });

  const { mutate } = useMutation({
    mutationFn: (resourceId) =>
      addSeenResources(user, scenarioId, [resourceId]),
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
    isLoaded: seenQuery.isSuccess,
    markSeen,
  };
}
