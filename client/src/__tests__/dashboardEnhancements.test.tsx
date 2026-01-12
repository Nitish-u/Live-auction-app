import { render, screen, waitFor } from "@testing-library/react"
import { RecentAuctionsTable } from "@/components/dashboard/RecentAuctionsTable"
import { ActiveBidsTable } from "@/components/dashboard/ActiveBidsTable"
import { WonAuctionsWidget } from "@/components/dashboard/WonAuctionsWidget"
import { RecentAssetsWidget } from "@/components/dashboard/RecentAssetsWidget"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { vi, describe, it, expect, beforeEach } from "vitest"

// Mock API
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn(),
    },
}));

import { api } from "@/lib/api"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
})

const renderWithProviders = (component: React.ReactNode) => {
    const router = createMemoryRouter([
        {
            path: "/",
            element: component,
        },
    ])

    return render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    )
}

describe("Dashboard Enhancements", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("RecentAuctionsTable", () => {
        it("renders auctions list", async () => {
            (api.get as any).mockResolvedValue({
                data: {
                    assets: [
                        {
                            id: "asset1",
                            title: "Test Asset",
                            auction: {
                                id: "1",
                                status: "LIVE",
                                startTime: new Date().toISOString(),
                                endTime: new Date().toISOString(),
                                createdAt: new Date().toISOString(),
                            }
                        }
                    ]
                }
            })

            renderWithProviders(<RecentAuctionsTable />)

            await waitFor(() => {
                expect(screen.getByText(/Recent Auctions/)).toBeInTheDocument()
                expect(screen.getByText("Test Asset")).toBeInTheDocument()
            })
        })

        it("shows empty state when no auctions", async () => {
            (api.get as any).mockResolvedValue({ data: { assets: [] } })
            renderWithProviders(<RecentAuctionsTable />)

            await waitFor(() => {
                expect(screen.getByText(/No auctions yet/)).toBeInTheDocument()
            })
        })
    })

    describe("ActiveBidsTable", () => {
        it("renders active bids with countdown", async () => {
            (api.get as any).mockResolvedValue({
                data: [
                    {
                        id: "1",
                        amount: 100,
                        auction: {
                            id: "1",
                            asset: { title: "Active Bid Asset" },
                            endTime: new Date(Date.now() + 10000).toISOString(),
                            status: "LIVE"
                        }
                    }
                ]
            })

            renderWithProviders(<ActiveBidsTable />)

            await waitFor(() => {
                expect(screen.getByText(/Active Bids/)).toBeInTheDocument()
                expect(screen.getByText("Active Bid Asset")).toBeInTheDocument()
            })
        })
    })

    describe("WonAuctionsWidget", () => {
        it("renders won auctions", async () => {
            (api.get as any).mockResolvedValue({
                data: [
                    {
                        id: "1",
                        asset: { title: "Won Asset" },
                        highestBidAmount: 500,
                        escrow: { status: "HOLDING" }
                    }
                ]
            })

            renderWithProviders(<WonAuctionsWidget />)

            await waitFor(() => {
                expect(screen.getByText(/Won Auctions/)).toBeInTheDocument()
                expect(screen.getByText("Won Asset")).toBeInTheDocument()
                expect(screen.getByText("HOLDING")).toBeInTheDocument()
            })
        })
    })

    describe("RecentAssetsWidget", () => {
        it("renders recent assets", async () => {
            (api.get as any).mockResolvedValue({
                data: {
                    assets: [
                        {
                            id: "1",
                            title: "Recent Asset",
                            status: "APPROVED",
                            createdAt: new Date().toISOString()
                        }
                    ]
                }
            })

            renderWithProviders(<RecentAssetsWidget />)

            await waitFor(() => {
                expect(screen.getByText(/Recent Assets/)).toBeInTheDocument()
                expect(screen.getByText("Recent Asset")).toBeInTheDocument()
                expect(screen.getByText("Approved")).toBeInTheDocument()
            })
        })
    })
})
