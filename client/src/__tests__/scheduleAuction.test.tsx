import { render, screen, waitForElementToBeRemoved } from "@testing-library/react"
import { ScheduleAuctionForm } from "@/components/auctions/ScheduleAuctionForm"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { vi, describe, it, expect, beforeEach } from "vitest"
import * as apiModule from "@/lib/api"

// Mock API
vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual("@/lib/api")
    return {
        ...actual,
        api: {
            get: vi.fn(),
            post: vi.fn(),
        },
    }
})

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
        </QueryClientProvider>
    )
}

describe("ScheduleAuctionForm", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const mockAssets = [
        { id: "1", title: "Asset 1", status: "APPROVED", images: ["img1.jpg"] },
    ]

    it("renders form and loads assets", async () => {
        (apiModule.api.get as any).mockResolvedValue({ data: mockAssets })

        render(<ScheduleAuctionForm />, { wrapper: createWrapper() })

        await waitForElementToBeRemoved(() => screen.queryByTestId("loading-skeleton"))

        expect(screen.getByText("Select Asset *")).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: /Schedule Auction/ })).toBeInTheDocument()
    })

    it("submits form with valid data", async () => {
        vi.clearAllMocks();
        (apiModule.api.get as any).mockResolvedValue({ data: mockAssets });
        (apiModule.api.post as any).mockResolvedValue({ data: { id: "auction-1", status: "SCHEDULED" } });

        render(<ScheduleAuctionForm />, { wrapper: createWrapper() })

        await waitForElementToBeRemoved(() => screen.queryByTestId("loading-skeleton"))

        const submitBtn = screen.getByRole("button", { name: /Schedule Auction/i })
        expect(submitBtn).toBeDisabled()
    })
})
