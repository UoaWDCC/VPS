import { Resend } from "resend";
import { HttpError } from "./error.js";
import STATUS from "./status.js";
import { buildEmail } from "./emailTemplates.js";

// Created lazily (not at module load) so importing this file never blows up
// in contexts where RESEND_API_KEY isn't set yet (e.g. tests).
let client;
const getClient = () => {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
};

// TODO: replace with a verified sender once a domain is added at
// https://resend.com/domains — onboarding@resend.dev is test-only.
const DEFAULT_FROM = "VPS <onboarding@resend.dev>";

export async function sendEmail({
  to,
  template,
  data,
  subject,
  html,
  text,
  from,
  ...rest
}) {
  const built = template ? buildEmail(template, data) : {};
  const resolvedFrom = from || process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  // onboarding@resend.dev (the no-domain default) can only deliver to Resend's
  // test addresses or the Resend account owner's own email. Redirect real
  // recipients there for now — swap automatically once RESEND_FROM_EMAIL
  // (a verified domain) is set.
  const usingTestSender = resolvedFrom === DEFAULT_FROM;
  const resolvedTo = usingTestSender
    ? process.env.RESEND_TEST_EMAIL || "delivered@resend.dev"
    : to;

  const { data: result, error } = await getClient().emails.send({
    from: resolvedFrom,
    to: resolvedTo,
    subject: subject || built.subject,
    html: html || built.html,
    text,
    ...rest,
  });

  if (error) {
    throw new HttpError(
      error.message || "Failed to send email",
      STATUS.INTERNAL_SERVER_ERROR
    );
  }

  return result;
}
