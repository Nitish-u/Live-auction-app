import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
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
            console.error('[MAIL] Error connecting to SMTP server:', error);
        } else {
            console.log('[MAIL] SMTP connection established successfully. Ready to send emails.');
        }
    });
}
