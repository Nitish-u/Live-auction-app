import { Prisma } from "@prisma/client";
import { password } from "../utils/password";
import { token } from "../utils/jwt";
import { registerSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.schema";
import { emailService } from "./email.service";
import { z } from "zod";
import crypto from "crypto";
import prisma from "../config/prisma";

export const authService = {
    register: async (input: z.infer<typeof registerSchema>) => {
        // 1. Transactional Create
        return await prisma.$transaction(async (tx: any) => {
            // 2. Check duplicate
            const existing = await tx.user.findUnique({ where: { email: input.email } });
            if (existing) {
                throw { statusCode: 400, message: "Email already exists", code: "DUPLICATE_EMAIL" };
            }

            // 3. Hash password
            const hashedPassword = await password.hash(input.password);

            // 4. Create User
            const user = await tx.user.create({
                data: {
                    email: input.email,
                    password: hashedPassword,
                },
            });

            // 5. Create Wallet
            await tx.wallet.create({
                data: { userId: user.id },
            });

            // 6. Generate Token
            const accessToken = token.sign({ sub: user.id, role: user.role });

            return {
                token: accessToken,
                user: { id: user.id, email: user.email, role: user.role },
            };
        });
    },

    login: async (input: z.infer<typeof loginSchema>) => {
        const user = await prisma.user.findUnique({ where: { email: input.email } });

        if (!user) {
            throw { statusCode: 401, message: "Invalid email or password", code: "INVALID_CREDENTIALS" };
        }

        const valid = await password.compare(input.password, user.password);
        if (!valid) {
            throw { statusCode: 401, message: "Invalid email or password", code: "INVALID_CREDENTIALS" };
        }

        if (user.status !== "ACTIVE") {
            throw { statusCode: 403, message: "User is suspended or deleted", code: "USER_INACTIVE" };
        }

        const accessToken = token.sign({ sub: user.id, role: user.role });

        return {
            token: accessToken,
            user: { id: user.id, email: user.email, role: user.role },
        };
    },


    changePassword: async (userId: string, input: z.infer<typeof changePasswordSchema>) => {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw { statusCode: 404, message: "User not found", code: "USER_NOT_FOUND" };
        }

        const valid = await password.compare(input.currentPassword, user.password);
        if (!valid) {
            throw { statusCode: 401, message: "Invalid current password", code: "INVALID_PASSWORD" };
        }

        const hashedPassword = await password.hash(input.newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: "Password updated successfully" };
    },

    forgotPassword: async (input: z.infer<typeof forgotPasswordSchema>) => {
        const user = await prisma.user.findUnique({ where: { email: input.email } });

        // We return success even if user doesn't exist to prevent email enumeration
        if (!user) {
            console.log(`[AUTH] Forgot password request for non-existent email: ${input.email}`);
            return { message: "If an account with that email exists, we sent you a password reset link." };
        }

        console.log(`[AUTH] Generating reset token for user: ${user.email}`);

        // Generate a random token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

        // Save token to DB (invalidate old tokens first)
        await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
            prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    token: resetToken,
                    expiresAt,
                },
            })
        ]);

        // Send email
        try {
            console.log(`[AUTH] Attempting to send reset email to ${user.email}...`);
            await emailService.sendPasswordResetEmail(user.email, resetToken);
            console.log(`[AUTH] Reset email successfully sent to ${user.email}`);
        } catch (error) {
            console.error(`[AUTH] Failed to send reset email to ${user.email}:`, error);
            // In a real app we might want to throw here or retry, but usually we just log
        }

        return { message: "If an account with that email exists, we sent you a password reset link." };
    },

    resetPassword: async (input: z.infer<typeof resetPasswordSchema>) => {
        const resetTokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token: input.token },
            include: { user: true },
        });

        if (!resetTokenRecord) {
            throw { statusCode: 400, message: "Invalid or expired password reset token", code: "INVALID_TOKEN" };
        }

        if (resetTokenRecord.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
            throw { statusCode: 400, message: "Invalid or expired password reset token", code: "EXPIRED_TOKEN" };
        }

        const hashedPassword = await password.hash(input.newPassword);

        // Update password and delete token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetTokenRecord.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } }),
        ]);

        return { message: "Password has been successfully reset" };
    },
};
