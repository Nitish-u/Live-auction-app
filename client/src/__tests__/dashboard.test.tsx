import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "../pages/Dashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as api from "../lib/api";
import * as auth from "../lib/auth";

// Mock API and Auth
vi.mock("../lib/api");
vi.mock("../lib/auth");

const createTestWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
        </QueryClientProvider>
    );
};

const mockSellerData: api.SellerDashboardStats = {
    assets: { total: 10, approved: 5, pending: 2 },
    auctions: { scheduled: 1, live: 2, ended: 3 },
    earnings: { totalReleased: "1000.00", inEscrow: "500.00" }
};

const mockBidderData: api.BidderDashboardStats = {
    bids: { active: 3, won: 1, lost: 2 },
    wallet: { balance: "200.00", locked: "100.00" }
};

const mockAdminData: api.AdminDashboardStats = {
    assets: { pendingReview: 4 },
    auctions: { live: 5 },
    escrows: { holding: 6 },
    disputes: { open: 1 }
};

describe("Dashboard Page", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Default role USER
        (auth.getCurrentUser as any).mockReturnValue({ sub: "u1", role: "USER" });
        (api.getSellerDashboard as any).mockResolvedValue(mockSellerData);
        (api.getBidderDashboard as any).mockResolvedValue(mockBidderData);
        (api.getAdminDashboard as any).mockResolvedValue(mockAdminData);
    });

    it("renders Seller and Bidder tabs by default", async () => {
        render(<Dashboard />, { wrapper: createTestWrapper() });
        await waitFor(() => {
            expect(screen.getByText("Total Assets")).toBeInTheDocument(); // Seller tab default
            expect(screen.getByText("Seller")).toBeInTheDocument();
            expect(screen.getByText("Bidder")).toBeInTheDocument();
            expect(screen.queryByText("Admin")).not.toBeInTheDocument();
        });
    });

    it("renders Admin tab for ADMIN user", async () => {
        (auth.getCurrentUser as any).mockReturnValue({ sub: "a1", role: "ADMIN" });
        render(<Dashboard />, { wrapper: createTestWrapper() });
        await waitFor(() => {
            expect(screen.getByText("Admin")).toBeInTheDocument();
        });
    });

    it("displays seller stats", async () => {
        render(<Dashboard />, { wrapper: createTestWrapper() });
        await waitFor(() => {
            expect(screen.getByText("10")).toBeInTheDocument(); // total assets
            expect(screen.getByText("2")).toBeInTheDocument(); // live auctions (just number now)
            expect(screen.getByText("$1,000.00")).toBeInTheDocument(); // released earnings (formatted)
        });
    });

    it("displays bidder stats when tab clicked", async () => {
        render(<Dashboard />, { wrapper: createTestWrapper() });
        const bidderTab = screen.getByText("Bidder");
        const user = userEvent.setup();
        await user.click(bidderTab);

        await waitFor(() => {
            expect(screen.getByText("Active Bids")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument(); // active bids
            expect(screen.getByText("$200.00")).toBeInTheDocument(); // wallet balance
        });
    });

    it("displays admin stats and dispute manager when Admin tab clicked", async () => {
        (auth.getCurrentUser as any).mockReturnValue({ sub: "a1", role: "ADMIN" });
        const mockDisputes = [
            {
                id: "d1",
                escrowId: "e1",
                buyerId: "u2",
                reason: "Item not received",
                status: "OPEN",
                createdAt: "2023-01-01",
                escrow: {
                    id: "e1",
                    amount: "100.00",
                    status: "HOLDING",
                    auction: { title: "Test Auction", asset: { title: "Test Asset" } }
                },
                buyer: { email: "buyer@example.com" }
            }
        ];
        (api.fetchDisputes as any).mockResolvedValue(mockDisputes);

        render(<Dashboard />, { wrapper: createTestWrapper() });

        await waitFor(() => expect(screen.getByText("Admin")).toBeInTheDocument());
        const user = userEvent.setup();
        await user.click(screen.getByText("Admin"));

        await waitFor(() => {
            expect(screen.getByText("Pending Assets")).toBeInTheDocument();
            expect(screen.getByText("4")).toBeInTheDocument();
            expect(screen.getByText("Dispute Manager")).toBeInTheDocument();
        });

        // Separate wait for table content to allow query to resolve
        await waitFor(() => {
            // If this fails, it might be rendering empty state or loading
            if (screen.queryByText("No Open Disputes")) {
                throw new Error("Rendered Empty State instead of rows");
            }
            expect(screen.getByText("Test Asset")).toBeInTheDocument();
            expect(screen.getByText("Refund Buyer")).toBeInTheDocument();
        });
    });
});
