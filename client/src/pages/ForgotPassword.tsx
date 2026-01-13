import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { forgotPassword, getFriendlyErrorMessage } from "@/lib/api";

const schema = z.object({
    email: z.string().email("Invalid email address"),
});

export function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ email: string }>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (values: { email: string }) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await forgotPassword(values.email);
            setSuccessMessage(response.message);
            toast.success("Reset link sent!");
        } catch (err: unknown) {
            const message = getFriendlyErrorMessage(err);
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset Password"
            description="Enter your email to receive a password reset link"
        >
            <div className="grid gap-6">
                {error && (
                    <div className="flex items-center gap-x-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="flex items-center gap-x-2 rounded-md bg-green-500/15 p-3 text-sm text-green-600 border border-green-500/20">
                        <p>{successMessage}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Email
                            </label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading || !!successMessage}
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
                            )}
                        </div>
                        <Button disabled={isLoading || !!successMessage}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                    </div>
                </form>
                <div className="flex justify-center text-sm text-muted-foreground">
                    Remember your password?
                    <Link
                        to="/login"
                        className="ml-1 text-primary hover:underline font-medium"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
