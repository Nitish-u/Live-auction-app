import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { ProposalForm } from "@/components/proposals/ProposalForm"
import { ProposalCard } from "@/components/proposals/ProposalCard"
import { ProposalsList } from "@/components/proposals/ProposalsList"
import { useAuth } from "@/hooks/useAuth"

// Mocks
vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn()
}))

vi.mock("@/lib/api", () => ({
    api: {
        post: vi.fn(),
        get: vi.fn()
    }
}))

vi.mock("@tanstack/react-query", () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false
    })),
    useQueryClient: vi.fn(() => ({
        invalidateQueries: vi.fn()
    }))
}))

// Mock Toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}))

describe("FEATURE 31: Proposals", () => {
    const mockUser = { id: "buyer-1", email: "buyer@example.com" }

    beforeEach(() => {
        vi.clearAllMocks()
            ; (useAuth as any).mockReturnValue({ user: mockUser })
    })

    describe("ProposalForm", () => {
        it("renders proposal form for buyer", () => {
            render(<ProposalForm assetId="asset-1" sellerId="seller-1" />)
            expect(screen.getByText(/Propose an Amount/i)).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /Send Proposal/i })).toBeInTheDocument()
        })

        it("hides form for seller", () => {
            ; (useAuth as any).mockReturnValue({ user: { id: "seller-1" } })
            const { container } = render(<ProposalForm assetId="asset-1" sellerId="seller-1" />)
            expect(container).toBeEmptyDOMElement()
        })
    })

    describe("ProposalCard", () => {
        const mockProposal = {
            id: "prop-1",
            proposedAmount: 500,
            status: "PENDING" as const,
            buyer: { id: "buyer-1", email: "buyer@example.com", displayName: "Buyer" },
            createdAt: new Date().toISOString()
        }

        it("displays proposal details", () => {
            render(<ProposalCard proposal={mockProposal} isSeller={true} />)
            expect(screen.getByText("$500.00")).toBeInTheDocument()
            expect(screen.getByText("PENDING")).toBeInTheDocument()
            expect(screen.getByText("Buyer")).toBeInTheDocument()
        })

        it("shows seller actions when pending and isSeller is true", () => {
            render(<ProposalCard proposal={mockProposal} isSeller={true} />)
            expect(screen.getByRole("button", { name: /Accept/i })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /Reject/i })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /Counter/i })).toBeInTheDocument()
        })

        it("hides seller actions when not seller", () => {
            render(<ProposalCard proposal={mockProposal} isSeller={false} />)
            expect(screen.queryByRole("button", { name: /Accept/i })).not.toBeInTheDocument()
        })

        it("hides actions when status is not PENDING", () => {
            const accepted = { ...mockProposal, status: "ACCEPTED" as const }
            render(<ProposalCard proposal={accepted} isSeller={true} />)
            expect(screen.queryByRole("button", { name: /Accept/i })).not.toBeInTheDocument()
        })
    })

    describe("ProposalsList", () => {
        it("renders list of proposals", async () => {
            const { useQuery } = await import("@tanstack/react-query")
                ; (useQuery as any).mockReturnValue({
                    data: [
                        { id: "1", proposedAmount: 100, status: "PENDING", createdAt: new Date().toISOString() }
                    ],
                    isLoading: false
                })

            render(<ProposalsList isSeller={true} />)
            expect(screen.getByText("$100.00")).toBeInTheDocument()
        })

        it("shows empty state", async () => {
            const { useQuery } = await import("@tanstack/react-query")
                ; (useQuery as any).mockReturnValue({
                    data: [],
                    isLoading: false
                })

            render(<ProposalsList isSeller={true} />)
            expect(screen.getByText(/No proposals received yet/i)).toBeInTheDocument()
        })
    })
})
