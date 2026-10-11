import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getComponentBindingTargets } from "../../../components/Properties/componentBindings";
import { checkScene } from "./checks";
import { formatValue } from "./describe";

const MAX_ENTRIES = 100;
// How long a changed property stays highlighted in the panel
const HIGHLIGHT_MS = 5000;

/**
 * State behind the author debug panel: an event log, the properties that just
 * changed, and static checks for the current scene. Does nothing unless
 * `enabled`, so regular players don't pay for it.
 *
 * Property changes are found by diffing, rather than logged where they are
 * applied, so the log shows what actually happened (including when the server
 * disagrees with the optimistic update on the page).
 */
export default function useDebugSession({
  enabled,
  sceneId,
  scene,
  properties,
  hasScene,
}) {
  const [entries, setEntries] = useState([]);
  const [changed, setChanged] = useState({});
  const startedAt = useRef(Date.now()).current;
  const nextId = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const log = useCallback((kind, title, lines = []) => {
    if (!enabledRef.current) return;
    setEntries((prev) =>
      [
        { id: nextId.current++, at: Date.now(), kind, title, lines },
        ...prev,
      ].slice(0, MAX_ENTRIES)
    );
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  // Entering a scene
  const lastSceneId = useRef(null);
  useEffect(() => {
    if (!enabled || !sceneId || lastSceneId.current === sceneId) return;
    lastSceneId.current = sceneId;
    const name = sceneRef.current?.name ?? `scene ${sceneId.slice(-4)}`;
    log("scene", `Entered ${name}`);
  }, [enabled, sceneId, log]);

  // Property changes. The first load is the baseline, not a change.
  const snapshot = useRef(null);
  useEffect(() => {
    const previous = snapshot.current;
    snapshot.current = new Map(properties.map((p) => [p.id, p.value]));
    if (!previous?.size) return;

    const diffs = properties
      .filter((p) => previous.has(p.id) && previous.get(p.id) !== p.value)
      .map((p) => ({
        id: p.id,
        name: p.name,
        from: previous.get(p.id),
        to: p.value,
      }));
    if (!diffs.length) return;

    setChanged(Object.fromEntries(diffs.map((d) => [d.id, d.from])));
    log(
      "state",
      diffs.length === 1
        ? "Property changed"
        : `${diffs.length} properties changed`,
      diffs.map(
        (d) => `${d.name} ${formatValue(d.from)} → ${formatValue(d.to)}`
      )
    );
  }, [properties, log]);

  useEffect(() => {
    if (!Object.keys(changed).length) return;
    const id = setTimeout(() => setChanged({}), HIGHLIGHT_MS);
    return () => clearTimeout(id);
  }, [changed]);

  const problems = useMemo(
    () =>
      enabled
        ? checkScene({
            scene,
            properties,
            hasScene,
            neighborsLoaded: scene?.neighborsLoaded === true,
            getBindingTargets: getComponentBindingTargets,
          })
        : [],
    // hasScene reads the page's scene cache, which is filled before the scene
    // object it belongs to is swapped in, so `scene` is enough to refresh it.
    [enabled, scene, properties]
  );
  const problemCount = problems.filter((p) => p.level !== "info").length;

  return { entries, log, clear, changed, problems, problemCount, startedAt };
}
