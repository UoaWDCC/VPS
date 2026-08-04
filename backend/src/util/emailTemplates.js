// Enum-like identifiers for the email structures below — same frozen-object
// pattern as STATUS in ./status.js, since this backend has no TypeScript.
export const EmailTemplate = Object.freeze({
  ACCESS_GRANTED: "ACCESS_GRANTED",
  WELCOME: "WELCOME",
});

// Each builder takes template data and returns { subject, html }.
// Add a new structure by adding a key here and to EmailTemplate above.
const builders = {
  [EmailTemplate.ACCESS_GRANTED]: ({ scenarioName }) => ({
    subject: `You've been granted access to ${scenarioName}`,
    html: `<p>You now have access to <strong>${scenarioName}</strong> on VPS.</p>`,
  }),

  [EmailTemplate.WELCOME]: ({ name }) => ({
    subject: "Welcome to VPS",
    html: `<p>Hi ${name || "there"}, welcome to the Virtual Patient Simulator!</p>`,
  }),
};

export function buildEmail(template, data = {}) {
  const build = builders[template];
  if (!build) throw new Error(`Unknown email template: ${template}`);
  return build(data);
}
