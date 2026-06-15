import nodemailer from 'nodemailer';

function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    ignoreTLS: true,
  });
}

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const transporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@medisphere.com',
    to: email,
    subject: 'Reset your MediSphere password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #1e293b; margin: 0;">MediSphere</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Connected Healthcare Ecosystem</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <h2 style="font-size: 18px; color: #1e293b; margin: 0 0 8px;">Reset your password</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
            You requested a password reset. Click the button below to create a new password. This link expires in 1 hour.
          </p>
          <div style="text-align: center;">
            <a href="${resetLink}" style="display: inline-block; background: #0891b2; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
              Reset Password
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log(`\n[DEV] Password reset link for ${email}: ${resetLink}\n`);
    return;
  }

  await transporter.sendMail(mailOptions);
}
