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

  const hasOtherScenes = (scenes ?? []).some((s) => s._id !== sceneId);

  const disabled = uniqueLinkedScenes.length > 1 || !hasOtherScenes;
  const defaultTarget =
    uniqueLinkedScenes.length === 1 ? uniqueLinkedScenes[0] : null;

  useEffect(() => {
    if (!disabled) return;
    if (directLink) modifySceneProp("directLink", null);
    if (directLinkKey != null) modifySceneProp("directLinkKey", null);
  }, [disabled, directLink, directLinkKey]);

  return { directLink, disabled, defaultTarget, hasOtherScenes };
}
