import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  try {
    // 1. Generate a cryptographically secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetLink = `https://www.giglizard.us/#reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // 2. Dispatch the email via Resend API if configured
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
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
                <p style="color: #666; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email.</p>
              </div>
            `
          })
        });
      } catch (e) {
        console.warn("Resend email dispatch error:", e);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, password reset instructions have been sent.'
    });
  } catch (error) {
    console.error('Password reset dispatch error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
}
