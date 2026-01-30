import nodemailer from 'nodemailer';
import logger from '../config/logger';
import { MailService } from '../modules/mail/mail.service';

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
            logger.info('')
        } catch (error) {
            console.error('[EMAIL] Error sending email:', error);
            throw error;
        }
    },

    sendPasswordResetEmail: async (to: string, token: string) => {
        // You might want to move the base URL to an environment variable
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password?token=${token}`;

        await MailService.sendMail({
            to,
            subject: 'Reset Your Password',
            templateName: 'resetPassword',
            variables: {
                RESET_LINK: resetLink
            }
        });
    }
};
