import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MobileNav } from "../components/layout/MobileNav";
import { TopNav } from "../components/layout/TopNav";
import { ThemeProvider } from "../components/layout/ThemeProvider";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme } from "../hooks/useTheme";
import { Button } from "../components/ui/button";

// Mocks
vi.mock("../components/notifications/NotificationBell", () => ({ NotificationBell: () => <div>NotificationBell</div> }));
vi.mock("../components/layout/UserMenu", () => ({ UserMenu: () => <div>UserMenu</div> }));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <MemoryRouter>{children}</MemoryRouter>
        </ThemeProvider>
    </QueryClientProvider>
);

describe("Theme System", () => {
    it("initializes with default theme", () => {
        render(
            <Wrapper>
                <div>Content</div>
            </Wrapper>
        );
        // By default it might be system, which applies dark or light based on media query mock
        // We just check if provider renders without crashing
        expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("toggles theme class on root element", async () => {
        const TestComponent = () => {
            const { setTheme } = useTheme();
            return <Button onClick={() => setTheme("dark")}>Set Dark</Button>;
        };

        render(
            <Wrapper>
                <TestComponent />
            </Wrapper>
        );

        fireEvent.click(screen.getByText("Set Dark"));

        await waitFor(() => {
            expect(document.documentElement.classList.contains("dark")).toBe(true);
        });
    });
});

describe("Navigation Layout", () => {
    beforeEach(() => {
        useAuthStore.getState().setAuth("token", { id: "1", email: "test@test.com", role: "USER" });
    });

    it("renders desktop navigation correctly", () => {
        render(
            <Wrapper>
                <TopNav />
            </Wrapper>
        );

        expect(screen.getByText("LiveAuction")).toBeInTheDocument();
        expect(screen.getByText("Explore Auctions")).toBeInTheDocument();
        expect(screen.getByText("Explore Assets")).toBeInTheDocument();
        expect(screen.getByText("NotificationBell")).toBeInTheDocument();
        expect(screen.getByText("UserMenu")).toBeInTheDocument();
    });

    it("renders mobile navigation drawer when opened", () => {
        const onClose = vi.fn();
        render(
            <Wrapper>
                <MobileNav open={true} onClose={onClose} />
            </Wrapper>
        );

        expect(screen.getByText("Explore Auctions")).toBeInTheDocument();
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Logout")).toBeInTheDocument();
    });
});
