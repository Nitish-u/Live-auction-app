import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { resetPassword, getFriendlyErrorMessage } from "@/lib/api";

const schema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ password: string; confirmPassword: string }>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (values: { password: string }) => {
        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await resetPassword(token, values.password);
            toast.success("Password reset successfully! Please login.");
            navigate("/login");
        } catch (err: unknown) {
            const message = getFriendlyErrorMessage(err);
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <AuthLayout title="Invalid Link" description="This password reset link is invalid or missing.">
                <div className="flex justify-center">
                    <Link to="/forgot-password" className="text-primary hover:underline">
                        Request a new one
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Set New Password"
            description="Enter your new password below"
        >
            <div className="grid gap-6">
                {error && (
                    <div className="flex items-center gap-x-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                New Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                disabled={isLoading}
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <label
                                htmlFor="confirmPassword"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Confirm Password
                            </label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                disabled={isLoading}
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm font-medium text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                        <Button disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                        </Button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
