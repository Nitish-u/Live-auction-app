import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { AssetDetailPage } from "@/pages/AssetDetailPage"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { vi, describe, it, expect } from "vitest"

// Mock api
const mockAsset = {
    id: "asset-1",
    title: "Asset Title",
    description: "Asset Description",
    images: ["img1.jpg", "img2.jpg"],
    status: "APPROVED",
    owner: {
        id: "seller-1",
        email: "seller@test.com",
        displayName: "Seller Name",
        avatarUrl: "avatar.jpg"
    },
    metadata: {
        year: 2023,
        condition: "New"
    }
}

const mockAuction = {
    id: "auction-1",
    status: "LIVE",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 100000).toISOString()
}

// Mock api module
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn((url: string) => {
            if (url.includes("/assets/asset-1")) {
                return Promise.resolve({ data: mockAsset })
            }
            if (url.includes("/auctions")) {
                return Promise.resolve({ data: { data: [mockAuction], items: [mockAuction] } })
            }
            if (url.includes("/users/seller-1/assets")) {
                return Promise.resolve({
                    data: {
                        items: [
                            { id: "asset-2", title: "Related Asset", status: "APPROVED", images: ["img.jpg"], owner: mockAsset.owner }
                        ]
                    }
                })
            }
            return Promise.reject(new Error("Not found"))
        })
    }
}))

// Mock useParams
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return {
        ...actual,
        useParams: () => ({ id: "asset-1" }),
        useNavigate: () => vi.fn()
    }
})

describe("AssetDetailPage", () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

    const renderPage = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <AssetDetailPage />
                </BrowserRouter>
            </QueryClientProvider>
        )
    }

    it("renders asset details when loaded", async () => {
        renderPage()

        await waitFor(() => {
            expect(screen.getByText("Asset Title")).toBeInTheDocument()
        })
    })

    it("displays image carousel and opens zoom modal", async () => {
        renderPage()
        await waitFor(() => {
            // Main image should be visible
            const imgs = screen.getAllByRole("img");
            expect(imgs.length).toBeGreaterThan(0);

            // Zoom button should be visible (title="Expand image")
            const zoomBtn = screen.getByTitle("Expand image");
            expect(zoomBtn).toBeInTheDocument();

            // Click zoom button
            fireEvent.click(zoomBtn);
        })

        // Check if modal content is visible
        // The dialog content renders into a portal, but testing-library can find it by role or text.
        // Dialog typically has role="dialog".
        await waitFor(() => {
            const dialog = screen.getByRole("dialog");
            expect(dialog).toBeInTheDocument();
            // Close button usually has text or is an icon button we can't easily find by text, 
            // but we can check if the image is inside the dialog. 
            // For simplicity, just finding the dialog confirms it opened.
        })
    })

    it("shows seller card with links", async () => {
        renderPage()

        await waitFor(() => {
            // Check for links
            const links = screen.getAllByRole("link");
            const profileLink = links.find(l => l.textContent?.match(/View Profile/i));
            expect(profileLink).toBeInTheDocument();
            expect(profileLink).toHaveAttribute("href", "/users/seller-1");
        })
    })

    it("shows auction status if approved", async () => {
        renderPage()
        await waitFor(() => {
            expect(screen.getByText(/Auction Details/i)).toBeInTheDocument()
        })
    })

    it("displays related items from seller", async () => {
        renderPage()
        await waitFor(() => {
            expect(screen.getByText("More from this Seller")).toBeInTheDocument()
        })
    })
})
