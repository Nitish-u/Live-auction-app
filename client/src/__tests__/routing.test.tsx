import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { Dashboard } from "../pages/Dashboard"; // Assume this exists or mock it
import { LoginPage } from "../pages/LoginPage";
import { useAuthStore } from "../store/useAuthStore";

// Mock everything needed
vi.mock("../pages/Dashboard", () => ({ Dashboard: () => <div>Dashboard Page</div> }));
vi.mock("../pages/LoginPage", () => ({ LoginPage: () => <div>Login Page</div> }));
vi.mock("../components/layout/AppLayout", () => ({ AppLayout: () => <div>App Layout</div> }));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderWithRouter = (initialEntries: string[]) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe("Routing Protection", () => {
    beforeEach(() => {
        useAuthStore.getState().logout();
    });

    it("redirects unauthenticated user to login when accessing protected route", () => {
        renderWithRouter(["/dashboard"]);
        expect(screen.getByText("Login Page")).toBeInTheDocument();
        expect(screen.queryByText("Dashboard Page")).not.toBeInTheDocument();
    });

    it("allows authenticated user to access protected route", () => {
        // Log in user
        useAuthStore.getState().setAuth("token", { id: "1", email: "test@test.com", role: "USER" });

        renderWithRouter(["/dashboard"]);
        expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });
});
