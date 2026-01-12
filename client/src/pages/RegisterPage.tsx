import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { register, getFriendlyErrorMessage } from "@/lib/api";

export function RegisterPage() {
    const navigate = useNavigate();
    const { isAuthenticated, login: setAuth } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleRegister = async (values: any) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await register({
                email: values.email,
                password: values.password,
                confirmPassword: values.confirmPassword,
            });
            setAuth(response.token, response.user);
            toast.success("Account created! Welcome.");
            navigate("/dashboard");
        } catch (err: any) {
            const message = getFriendlyErrorMessage(err);
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create an Account"
            description="Enter your email below to create your account"
        >
            <AuthForm
                type="register"
                onSubmit={handleRegister}
                isLoading={isLoading}
                error={error}
            />
        </AuthLayout>
    );
}
