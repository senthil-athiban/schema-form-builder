import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? "Form Builder <onboarding@resend.dev>";

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const logFailure = (message: EmailMessage, reason: unknown) => {
  console.error(`[email] Failed to send "${message.subject}" to ${message.to}:`, reason);
  // In development, show the content so links (e.g. verification) can still be used
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email] Content for ${message.to}:\n${message.text}\n`);
  }
};


export async function sendEmail(message: EmailMessage): Promise<void> {
  // Without a key (local dev), print the email so links can still be clicked
  if (!resend) {
    console.log(`[email] To: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
    return;
  }

  try {
    const { error } = await resend.emails.send({ from, ...message });
    if (error) console.error(`[email] Failed to send "${message.subject}" to ${message.to}:`, error);
  } catch (err) {
    logFailure(message, err);
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function verificationEmail(name: string | null | undefined, url: string): Omit<EmailMessage, "to"> {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "Verify your email",
    text: `${greeting}\n\nConfirm your email to start using Form Builder:\n${url}\n\nThis link expires in 1 hour. If you didn't sign up, ignore this email.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
        <p>${escapeHtml(greeting)}</p>
        <p>Confirm your email to start using Form Builder.</p>
        <p style="margin: 28px 0;">
          <a href="${escapeHtml(url)}" style="background: #4f46e5; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Verify email
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">This link expires in 1 hour. If you didn't sign up, you can ignore this email.</p>
      </div>
    `,
  };
}
