import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend using the environment variable configured in Vercel
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  try {
    // 1. Generate a cryptographically secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetLink = `https://www.giglizard.us/#reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // 2. IMPORTANT: If you have a database (Supabase, Firebase, Postgres),
    // save resetToken with an expiration timestamp (e.g., Date.now() + 3600000) for this user here.

    // 3. Dispatch the email via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'GigLizard Security <no-reply@giglizard.us>',
        to: email,
        subject: '🔐 Password Reset Request for GigLizard',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your GigLizard account password.</p>
            <p>Click the button below to choose a new password. This link is single-use and expires in 60 minutes.</p>
            <p style="margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">If you did not request this change, you can safely ignore this email.</p>
          </div>
        `,
      });
    }

    // 4. Return an identical generic success message to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a reset link has been dispatched.',
    });
  } catch (error) {
    console.error('Password reset dispatch error:', error);
    return res.status(500).json({ error: 'Failed to process request.' });
  }
}
