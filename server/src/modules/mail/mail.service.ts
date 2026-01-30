import fs from 'fs';
import path from 'path';
import { transporter } from './mail.config';
import { MailOptions } from './mail.types';
import logger from '../../config/logger';

export class MailService {
    private static async loadTemplate(templateName: string): Promise<string> {
        const templatePath = path.join(__dirname, 'templates', `${templateName}`);
        return fs.promises.readFile(templatePath, 'utf-8');
    }

    private static compileTemplate(base: string, body: string, variables: Record<string, string>): string {
        let html = base.replace('{{BODY_CONTENT}}', body);
        for (const key in variables) {
            // Replace all occurrences of the variable
            html = html.split(`{{${key}}}`).join(variables[key]);
        }
        return html;
    }

    static async sendMail(options: MailOptions): Promise<void> {
        const { to, subject, templateName, variables } = options;

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('[MAIL] SMTP credentials not found. Logging email to console instead.');
            console.log(`[MAIL MOCK] To: ${to}`);
            console.log(`[MAIL MOCK] Subject: ${subject}`);
            console.log(`[MAIL MOCK] Template: ${templateName}`);
            console.log(`[MAIL MOCK] Variables:`, variables);
            return;
        }

        try {
            // 1. Load base template
            const baseTemplate = await this.loadTemplate('baseTemplate.html');

            // 2. Load specific body template
            const bodyTemplate = await this.loadTemplate(`${templateName}.html`);

            // 3. Compile final HTML
            const html = this.compileTemplate(baseTemplate, bodyTemplate, variables);

            // 4. Send email
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to,
                subject,
                html,
            });

            console.log(`[MAIL] Sent '${templateName}' email to ${to}`);
        } catch (error) {
            console.error(`[MAIL] Error sending '${templateName}' email to ${to}:`, error);
            logger.error(`[MAIL] Failed to send email: ${error}`);
            throw error;
        }
    }
}
