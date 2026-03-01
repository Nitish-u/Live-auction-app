import fs from 'fs';
import path from 'path';
import { transporter } from './mail.config';
import { MailOptions } from './mail.types';
import logger from '../../config/logger';
import { logEvent } from '../../utils/logEvent';

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
            logEvent("INTEGRATION_MAIL_CONFIG_MISSING", {
                to,
                subject,
                templateName
            });
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

            logEvent("INTEGRATION_EMAIL_SENT", {
                to,
                templateName
            });
        } catch (error) {
            logEvent("INTEGRATION_EMAIL_FAILED", {
                to,
                templateName,
                error: (error as Error).message
            });
            throw error;
        }
    }
}
