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

// Verified sender domain (added at https://resend.com/domains).
const DEFAULT_FROM = "VPS <notifications@updates.vps.wdcc.co.nz>";

export async function sendEmail({
  to,
  template,
  data,
  subject,
  html,
  text,
  from,
  signal,
  ...rest
}) {
  const built = template ? buildEmail(template, data) : {};
  const resolvedFrom = from || process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  const { data: result, error } = await getClient().emails.send(
    {
      from: resolvedFrom,
      to,
      subject: subject || built.subject,
      html: html || built.html,
      text,
      ...rest,
    },
    { signal }
  );

  if (error) {
    throw new HttpError(
      error.message || "Failed to send email",
      STATUS.INTERNAL_SERVER_ERROR
    );
  }

  return result;
}
