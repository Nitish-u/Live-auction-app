import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
    },
});

// Verify connection configuration
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('[EMAIL] Error connecting to SMTP server:', error);
        } else {
            console.log('[EMAIL] SMTP connection established successfully. Ready to send emails.');
        }
    });
}

export const emailService = {
    sendEmail: async (to: string, subject: string, html: string) => {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP credentials not found. Logging email to console instead.');
            console.log(`[EMAIL MOCK] To: ${to}`);
            console.log(`[EMAIL MOCK] Subject: ${subject}`);
            console.log(`[EMAIL MOCK] Body: ${html}`);
            return;
        }

        try {
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to,
                subject,
                html,
            });
            console.log(`[EMAIL] Sent to ${to}`);
        } catch (error) {
            console.error('[EMAIL] Error sending email:', error);
            throw error;
        }
    },

    sendPasswordResetEmail: async (to: string, token: string) => {
        // You might want to move the base URL to an environment variable
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password?token=${token}`;

        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <p>Click the link below to proceed:</p>
        <p>
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </p>
        <p>Or copy this link: ${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

        await emailService.sendEmail(to, 'Reset Your Password', html);
    }
};
