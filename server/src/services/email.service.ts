import { MailService } from '../modules/mail/mail.service';

export const emailService = {
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
