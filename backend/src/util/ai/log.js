// One line per AI request, as JSON, so it can be searched and counted. It says
// who, which model, what it cost and how long it took, and the names of the
// tools the model used. It does not say what anyone typed or what the scenario
// contains, unless AI_LOG_CONTENT is on.

export function logAiRequest(entry) {
  console.log(JSON.stringify({ event: "ai.chat", ...entry }));
}
