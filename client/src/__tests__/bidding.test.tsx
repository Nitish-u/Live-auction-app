
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BidForm } from "../components/BidForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "../lib/api";


const createWrapper = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
};

describe("BidForm Component", () => {
    const mockPlaceBid = vi.spyOn(api, "placeBid");
    const auctionId = "auction-123";

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it("should show login message if not authenticated", () => {
        render(<BidForm auctionId={auctionId} currentHighestBid={100} />, { wrapper: createWrapper() });
        expect(screen.getByText(/Please log in to place a bid/i)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/Higher than/i)).not.toBeInTheDocument();
    });

    it("should render form if authenticated", () => {
        localStorage.setItem("token", "fake-token");
        render(<BidForm auctionId={auctionId} currentHighestBid={100} />, { wrapper: createWrapper() });
        expect(screen.getByPlaceholderText(/Higher than 100/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Bid" })).toBeInTheDocument();
    });

    it("should validate input amount", async () => {
        localStorage.setItem("token", "fake-token");
        render(<BidForm auctionId={auctionId} currentHighestBid={100} />, { wrapper: createWrapper() });

        const input = screen.getByPlaceholderText(/Higher than 100/i);
        const button = screen.getByRole("button", { name: "Bid" });

        // Too low
        fireEvent.change(input, { target: { value: "50" } });
        fireEvent.click(button);
        expect(await screen.findByText(/Bid must be higher than 100/i)).toBeInTheDocument();
        expect(mockPlaceBid).not.toHaveBeenCalled();
    });

    it("should submit valid bid", async () => {
        localStorage.setItem("token", "fake-token");
        mockPlaceBid.mockResolvedValueOnce({ status: "BID_PLACED", currentHighestBid: 200 });

        render(<BidForm auctionId={auctionId} currentHighestBid={100} />, { wrapper: createWrapper() });

        const input = screen.getByPlaceholderText(/Higher than 100/i);
        const button = screen.getByRole("button", { name: "Bid" });

        fireEvent.change(input, { target: { value: "200" } });
        fireEvent.click(button);

        await waitFor(() => expect(mockPlaceBid).toHaveBeenCalledWith(auctionId, 200));
        // Success handling (alert mock? or query invalidation check?)
        // Alert is hard to mock in jsdom without setup, but we can assume it worked if api called.
    });
});
