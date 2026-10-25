import { Resend } from 'resend';
import { env } from '../env';
import { logger } from './logger';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const emailEnabled = Boolean(resend);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const layout = (heading: string, body: string, cta: { label: string; url: string }) => `
<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f4f5;padding:32px 0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
    <div style="font-weight:700;font-size:20px;color:#7c3aed;margin-bottom:24px">Spendly</div>
    <h1 style="font-size:20px;color:#18181b;margin:0 0 12px">${heading}</h1>
    <p style="color:#52525b;line-height:1.6;margin:0 0 24px">${body}</p>
    <a href="${cta.url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${cta.label}</a>
    <p style="color:#a1a1aa;font-size:12px;margin-top:32px">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>`;

export const sendPasswordResetEmail = async (to: string, name: string, url: string) => {
  if (!resend) {
    // Local development without an email provider: print the link instead.
    logger.warn({ to, url }, 'RESEND_API_KEY not set – password reset link logged instead of emailed');
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Reset your Spendly password',
    html: layout(
      'Reset your password',
      `Hi ${escapeHtml(name)}, we received a request to reset your password. This link expires in 1 hour.`,
      { label: 'Reset password', url },
    ),
  });

  if (error) logger.error({ error }, 'Failed to send password reset email');
};
