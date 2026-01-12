import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssetGallery } from "../pages/AssetGallery";
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

describe("AssetGallery Page", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading state initially", async () => {
        (api.fetchAssets as any).mockReturnValue(new Promise(() => { }));
        render(<AssetGallery />, { wrapper: createTestWrapper() });
        // Check for skeleton elements
        const skeletons = document.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders assets after loading", async () => {
        const mockAssets = {
            items: [
                {
                    id: "1",
                    title: "Unique Sculpture",
                    images: ["img.jpg"],
                    owner: { id: "u1", displayName: "Artist One", avatarUrl: null },
                    auction: null
                },
                {
                    id: "2",
                    title: "Digital Art",
                    images: ["img2.jpg"],
                    owner: { id: "u2", displayName: "Artist Two", avatarUrl: null },
                    auction: { id: "a1", status: "LIVE" }
                }
            ],
            totalPages: 1,
            page: 1,
            totalItems: 2
        };

        (api.fetchAssets as any).mockResolvedValue(mockAssets);

        render(<AssetGallery />, { wrapper: createTestWrapper() });

        await waitFor(() => {
            expect(screen.getByText("Unique Sculpture")).toBeInTheDocument();
            expect(screen.getByText("Digital Art")).toBeInTheDocument();
            expect(screen.getByText("Artist One")).toBeInTheDocument();
            expect(screen.getByText("Live Auction")).toBeInTheDocument();
        });
    });

    it("renders empty state", async () => {
        (api.fetchAssets as any).mockResolvedValue({ items: [], totalPages: 0, page: 1, totalItems: 0 });
        render(<AssetGallery />, { wrapper: createTestWrapper() });
        await waitFor(() => {
            expect(screen.getByText("No assets found")).toBeInTheDocument();
        });
    });
});
