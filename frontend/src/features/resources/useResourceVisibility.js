import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { filterTreeByConditions } from "../../utils/propertyConditionalEvaluator";
import { buildResourceTree } from "./util";
import { useResources } from "./useResources";
import { useSeenResources } from "./useSeenResources";
import { collectVisibleFileIds, getUnseenIds } from "./seen";

export function useResourceVisibility(properties, enabled) {
  const { resourcesQuery } = useResources();
  const { seenIds, isLoaded, markSeen } = useSeenResources();
  const lastVisibleKey = useRef(null);
  const ready = enabled && isLoaded && resourcesQuery.isSuccess;

  const filteredTree = useMemo(
    () =>
      filterTreeByConditions(
        buildResourceTree(resourcesQuery.data ?? []),
        properties
      ),
    [resourcesQuery.data, properties]
  );
  const visibleIds = useMemo(
    () => collectVisibleFileIds(filteredTree),
    [filteredTree]
  );
  const unseenIds = useMemo(
    () => (ready ? getUnseenIds(visibleIds, seenIds) : []),
    [ready, visibleIds, seenIds]
  );
  const visibleKey = [...visibleIds].sort().join(",");

  // only toast when visible resources set changes
  useEffect(() => {
    if (!ready || lastVisibleKey.current === visibleKey) return;
    lastVisibleKey.current = visibleKey;

    const count = unseenIds.length;
    if (count > 0) {
      toast(
        `You have ${count} new resource${count === 1 ? "" : "s"} available`
      );
    }
  }, [ready, visibleKey]);

  return { filteredTree, unseenIds, markSeen, resourcesQuery };
}
