// Helpers for the server-authoritative scene timer.

// Seconds left on the current scene's timer given when it was entered.
// null time = no timer
// missing stamp (legacy session) = full duration.
export const remainingFor = (sceneTime, enteredAt) => {
  if (sceneTime == null) return null;
  if (!enteredAt) return sceneTime;
  const elapsed = (Date.now() - new Date(enteredAt).getTime()) / 1000;
  return Math.max(0, sceneTime - elapsed);
};

// Find the active scene's `time` within a getConnectedScenes result.
export const getActiveSceneTime = (scenes) => {
  const active = scenes.scenes.find(
    (s) => String(s._id) === String(scenes.active)
  );
  return active?.time ?? null;
};
