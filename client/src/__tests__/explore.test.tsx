import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExploreAuctions } from "../pages/ExploreAuctions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as api from "../lib/api";

// Mock API
vi.mock("../lib/api");

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

describe("ExploreAuctions Page", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading state initially", async () => {
        // Return a pending promise to simulate loading
        (api.fetchAuctions as any).mockReturnValue(new Promise(() => { }));
        render(<ExploreAuctions />, { wrapper: createTestWrapper() });
        // Check for skeleton or simply that content is not yet there
        // The skeletons use animate-pulse, let's verify skeleton presence
        // There are multiple skeletons, querySelectorAll might work or getByTestId if we added it.
        // But simply checking that text is NOT present is a weak test.
        // Let's assume loading state is default.
        const skeletons = document.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders auctions after loading", async () => {
        const mockAuctions = {
            data: [
                {
                    id: "1",
                    assetId: "a1",
                    sellerId: "s1",
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString(),
                    status: "SCHEDULED",
                    asset: { title: "Rare Painting", images: ["img.jpg"] },
                    seller: { id: "s1", email: "seller@test.com" }
                }
            ],
            meta: { total: 1 }
        };

        (api.fetchAuctions as any).mockResolvedValue(mockAuctions);

        render(<ExploreAuctions />, { wrapper: createTestWrapper() });

        await waitFor(() => {
            expect(screen.getByText("Rare Painting")).toBeInTheDocument();
            expect(screen.getByText(/seller@test.com/)).toBeInTheDocument();
        });
    });

    it("renders empty state", async () => {
        (api.fetchAuctions as any).mockResolvedValue({ data: [], meta: { total: 0 } });
        render(<ExploreAuctions />, { wrapper: createTestWrapper() });
        await waitFor(() => {
            expect(screen.getByText("No auctions found.")).toBeInTheDocument();
        });
    });
});
