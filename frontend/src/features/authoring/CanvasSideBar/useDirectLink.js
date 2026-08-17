import { useEffect } from "react";
import useVisualScene from "../stores/visual";
import { modifySceneProp } from "../scene/operations/modifiers";

export default function useDirectLink() {
  const directLink = useVisualScene((scene) => scene.directLink);
  const directLinkKey = useVisualScene((scene) => scene.directLinkKey);
  const components = useVisualScene((scene) => scene.components);

  const uniqueLinkedScenes = [
    ...new Set(
      Object.values(components ?? {})
        .filter((c) => c.clickable && c.nextScene)
        .map((c) => c.nextScene)
    ),
  ];

  const disabled = uniqueLinkedScenes.length > 1;
  const defaultTarget =
    uniqueLinkedScenes.length === 1 ? uniqueLinkedScenes[0] : null;

  useEffect(() => {
    if (!disabled) return;
    if (directLink) modifySceneProp("directLink", null);
    if (directLinkKey != null) modifySceneProp("directLinkKey", null);
  }, [disabled]);

  return { directLink, disabled, defaultTarget };
}
