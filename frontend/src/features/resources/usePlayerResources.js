import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { filterTreeByConditions } from "../../utils/propertyConditionalEvaluator";
import { buildResourceTree, flattenFiles } from "./util";
import { useResources } from "./useResources";
import { useSeenResources } from "./useSeenResources";

export function usePlayerResources(properties, enabled) {
  const { resourcesQuery } = useResources();
  const { seenIds, isLoaded, markSeen } = useSeenResources();
  const announcedIds = useRef(new Set());
  const ready = enabled && isLoaded && resourcesQuery.isSuccess;

  // NOTE: the filtering by properties should ideally be done on the
  // server to prevent cheating, but here we filter before rendering
  const tree = filterTreeByConditions(
    buildResourceTree(resourcesQuery.data ?? []),
    properties
  );
  const seen = new Set(seenIds);
  const unseenIds = ready
    ? flattenFiles(tree)
        .map((resource) => resource._id)
        .filter((id) => !seen.has(id))
    : [];

  // toast unseen resources once a session
  useEffect(() => {
    const fresh = unseenIds.filter((id) => !announcedIds.current.has(id));
    fresh.forEach((id) => announcedIds.current.add(id));

    const count = fresh.length;
    if (count > 0) {
      toast(
        `You have ${count} new resource${count === 1 ? "" : "s"} available`
      );
    }
  }, [unseenIds]);

  const { isLoading, isError, error } = resourcesQuery;

  return { tree, unseenIds, markSeen, isLoading, isError, error };
}
