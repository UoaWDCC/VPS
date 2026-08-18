// Enum-like identifiers for the email structures below — same frozen-object
// pattern as STATUS in ./status.js, since this backend has no TypeScript.
export const EmailTemplate = Object.freeze({
  ACCESS_GRANTED: "ACCESS_GRANTED",
  WELCOME: "WELCOME",
  YOUR_TURN: "YOUR_TURN",
});

// name/scenarioName come from User.name, Group.users[].name, and Scenario.name
// — free text with no format restrictions or sanitization anywhere upstream —
// so they must be escaped here, at the point they're interpolated into html.
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]
  );

// Each builder takes template data and returns { subject, html }.
// Add a new structure by adding a key here and to EmailTemplate above.
const builders = {
  [EmailTemplate.ACCESS_GRANTED]: ({ scenarioName }) => ({
    subject: `You've been granted access to ${scenarioName}`,
    html: `<p>You now have access to <strong>${escapeHtml(scenarioName)}</strong> on VPS.</p>`,
  }),

  [EmailTemplate.WELCOME]: ({ name }) => ({
    subject: "Welcome to VPS",
    html: `<p>Hi ${escapeHtml(name || "there")}, welcome to the Virtual Patient Simulator!</p>`,
  }),

  [EmailTemplate.YOUR_TURN]: ({ name, scenarioName }) => ({
    subject: scenarioName
      ? `${scenarioName}: it's your turn`
      : "It's your turn",
    html: `<p>Hi ${escapeHtml(name || "there")}, your group member has finished their part${
      scenarioName ? ` of <strong>${escapeHtml(scenarioName)}</strong>` : ""
    }. It's your turn to continue the scenario.</p>`,
  }),
};

export function buildEmail(template, data = {}) {
  const build = builders[template];
  if (!build) throw new Error(`Unknown email template: ${template}`);
  return build(data);
}
