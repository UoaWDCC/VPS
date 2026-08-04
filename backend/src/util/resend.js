import { Resend } from "resend";
import { HttpError } from "./error.js";
import STATUS from "./status.js";
import { buildEmail } from "./emailTemplates.js";

export const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { data: result, error } = await resend.emails.send({
    from: from || process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    to,
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
