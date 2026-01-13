import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { login, getFriendlyErrorMessage, type LoginParams } from "@/lib/api";

export function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated, login: setAuth } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleLogin = async (values: LoginParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await login(values);
            setAuth(response.token, response.user);
            toast.success("Welcome back!");
            navigate("/dashboard");
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
            title="Welcome Back"
            description="Enter your email to sign in to your account"
        >
            <AuthForm
                type="login"
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={error}
            />
            <div className="mt-2 text-center text-sm">
                <Link to="/forgot-password" className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
                    Forgot your password?
                </Link>
            </div>
        </AuthLayout>
    );
}
