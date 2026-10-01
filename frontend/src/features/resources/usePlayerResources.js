import { useEffect, useMemo, useRef } from "react";
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
  const tree = useMemo(
    () =>
      filterTreeByConditions(
        buildResourceTree(resourcesQuery.data ?? []),
        properties
      ),
    [resourcesQuery.data, properties]
  );
  const visibleIds = useMemo(
    () => flattenFiles(tree).map((resource) => resource._id),
    [tree]
  );
  const unseenIds = useMemo(() => {
    if (!ready) return [];
    const seen = new Set(seenIds);
    return visibleIds.filter((id) => !seen.has(id));
  }, [ready, visibleIds, seenIds]);

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
