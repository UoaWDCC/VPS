// Helpers for the server-authoritative scene timer.

// Find the active scene's `time` within a getConnectedScenes result.
// null = no timer configured for this scene.
const getActiveSceneTime = (scenes) => {
  const active = scenes.scenes.find(
    (s) => String(s._id) === String(scenes.active)
  );
  return active?.time ?? null;
};

// A fresh entry into a scene — first visit, an author jump, or a real scene
// move — always starts the timer at its full configured duration.
export const freshRemainingTime = (scenes) => getActiveSceneTime(scenes);

// A plain re-fetch/refresh of the current scene resumes from the entry
// stamp, so refreshing the page can't reset the timer. A missing stamp
// (legacy session, predating this stamp) falls back to the full duration.
export const resumedRemainingTime = (scenes, enteredAt) => {
  const sceneTime = getActiveSceneTime(scenes);
  if (sceneTime == null) return null;
  if (!enteredAt) return sceneTime;
  const elapsed = (Date.now() - new Date(enteredAt).getTime()) / 1000;
  return Math.max(0, sceneTime - elapsed);
};

// `scenes` is only set when a move actually happened; a no-move interaction
// should leave the client's already-running countdown alone, so this omits
// the field entirely rather than setting it to null.
export const movedRemainingTimeField = (scenes) =>
  scenes ? { remainingTime: freshRemainingTime(scenes) } : {};
