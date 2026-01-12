import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";

// Mock api
vi.mock("../lib/api", async () => {
    const actual = await vi.importActual("../lib/api");
    return {
        ...actual,
        register: vi.fn(),
        login: vi.fn(),
    };
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithProviders = (ui: React.ReactNode) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {ui}
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe("Auth Pages", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useAuthStore.getState().logout();
    });

    describe("RegisterPage", () => {
        it("renders register form", () => {
            renderWithProviders(<RegisterPage />);
            expect(screen.getByRole("heading", { name: "Create an Account", level: 1 })).toBeInTheDocument();
            expect(screen.getByLabelText("Email")).toBeInTheDocument();
            expect(screen.getByLabelText("Password")).toBeInTheDocument();
            expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
        });

        it("validates password mismatch", async () => {
            renderWithProviders(<RegisterPage />);

            fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
            fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "mismatch" } });

            fireEvent.click(screen.getByRole("button", { name: /create account/i }));

            await waitFor(() => {
                expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
            });
        });

        it("calls register api on success", async () => {
            vi.mocked(api.register).mockResolvedValue({
                token: "fake-token",
                user: { id: "1", email: "test@example.com", role: "USER" }
            });

            renderWithProviders(<RegisterPage />);

            fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
            fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "password123" } });

            fireEvent.click(screen.getByRole("button", { name: /create account/i }));

            await waitFor(() => {
                expect(api.register).toHaveBeenCalledWith({
                    email: "test@example.com",
                    password: "password123",
                    confirmPassword: "password123"
                });
            });
        });
    });

    describe("LoginPage", () => {
        it("renders login form", () => {
            renderWithProviders(<LoginPage />);
            expect(screen.getByRole("heading", { name: "Welcome Back", level: 1 })).toBeInTheDocument();
            expect(screen.getByLabelText("Email")).toBeInTheDocument();
            expect(screen.getByLabelText("Password")).toBeInTheDocument();
            expect(screen.queryByLabelText("Confirm Password")).not.toBeInTheDocument();
        });

        it("calls login api on success", async () => {
            vi.mocked(api.login).mockResolvedValue({
                token: "fake-token",
                user: { id: "1", email: "test@example.com", role: "USER" }
            });

            renderWithProviders(<LoginPage />);

            fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
            fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });

            fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

            await waitFor(() => {
                expect(api.login).toHaveBeenCalledWith({
                    email: "test@example.com",
                    password: "password123"
                });
            });
        });
    });
});
