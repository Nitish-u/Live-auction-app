import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "../components/notifications/NotificationBell";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { notifications } from "../lib/api";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock API
vi.mock("../lib/api", () => ({
    notifications: {
        list: vi.fn(),
        markRead: vi.fn()
    }
}));

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
});

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("NotificationBell", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it("renders bell icon", async () => {
        (notifications.list as any).mockResolvedValue({ items: [], unreadCount: 0 });
        render(<NotificationBell />, { wrapper });
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("displays unread count badge", async () => {
        (notifications.list as any).mockResolvedValue({ items: [], unreadCount: 5 });
        render(<NotificationBell />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText("5")).toBeInTheDocument();
        });
    });

    it("opens dropdown and shows notifications", async () => {
        const user = userEvent.setup();
        const mockItems = [
            { id: "1", message: "Outbid on Watch", read: false, createdAt: new Date().toISOString() },
            { id: "2", message: "Auction Won", read: true, createdAt: new Date().toISOString() }
        ];
        (notifications.list as any).mockResolvedValue({ items: mockItems, unreadCount: 1 });

        render(<NotificationBell />, { wrapper });

        // Click bell
        await user.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(screen.getByText("Outbid on Watch")).toBeInTheDocument();
            expect(screen.getByText("Auction Won")).toBeInTheDocument();
        });
    });

    it.skip("calls markRead when clicking unread notification", async () => {
        const user = userEvent.setup();
        const mockItems = [
            { id: "1", message: "Click Me", read: false, createdAt: new Date().toISOString() }
        ];
        (notifications.list as any).mockResolvedValue({ items: mockItems, unreadCount: 1 });
        (notifications.markRead as any).mockResolvedValue({ success: true });

        render(<NotificationBell />, { wrapper });

        await user.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(screen.getByText("Click Me")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Click Me"));

        await waitFor(() => {
            expect(notifications.markRead).toHaveBeenCalledWith("1");
        });
    });
});
