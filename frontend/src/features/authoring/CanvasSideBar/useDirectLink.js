import { useEffect } from "react";
import useVisualScene from "../stores/visual";
import { modifySceneProp } from "../scene/operations/modifiers";

export default function useDirectLink(scenes) {
  const directLink = useVisualScene((scene) => scene.directLink);
  const directLinkKey = useVisualScene((scene) => scene.directLinkKey);
  const components = useVisualScene((scene) => scene.components);
  const sceneId = useVisualScene((scene) => scene.id);

  const uniqueLinkedScenes = [
    ...new Set(
      Object.values(components ?? {})
        .filter((c) => c.clickable && c.nextScene)
        .map((c) => c.nextScene)
    ),
  ];

  // With no other scene in the scenario, there's nothing for Direct Link to
  // send the player to - turning it on would leave it pointing at nothing.
  const hasOtherScenes = (scenes ?? []).some((s) => s._id !== sceneId);

  const disabled = uniqueLinkedScenes.length > 1 || !hasOtherScenes;
  const defaultTarget =
    uniqueLinkedScenes.length === 1 ? uniqueLinkedScenes[0] : null;

  useEffect(() => {
    if (!disabled) return;
    if (directLink) modifySceneProp("directLink", null);
    if (directLinkKey != null) modifySceneProp("directLinkKey", null);
    // directLink/directLinkKey are deps (not just disabled) so switching
    // straight from one already-disabled scene to another still re-checks
    // and clears that scene's own stale values, rather than skipping the
    // cleanup because `disabled` itself didn't change across the switch.
  }, [disabled, directLink, directLinkKey]);

  return { directLink, disabled, defaultTarget, hasOtherScenes };
}
