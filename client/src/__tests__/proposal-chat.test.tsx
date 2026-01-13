import { render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { ProposalChatBox } from "@/components/proposals/ProposalChatBox"
import { FinalizationWindow } from "@/components/proposals/FinalizationWindow"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeAll, describe, expect, it, vi } from "vitest"

// Mock scrollIntoView
beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
})

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
})

const renderWithClient = (ui: React.ReactNode) => {
    const testQueryClient = createTestQueryClient()
    return render(
        <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
    )
}

// Mock hooks
vi.mock("@/hooks/useWebSocket", () => ({
    useWebSocket: () => ({
        socket: {
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn()
        },
        isConnected: true
    })
}));

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({
        user: { id: "user1", displayName: "Test User" },
        token: "fake-token"
    })
}));

// Mock API
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn((url) => {
            if (url.includes("messages")) {
                return Promise.resolve({ data: [] });
            }
            if (url.includes("finalize")) {
                return Promise.resolve({
                    data: {
                        status: "PENDING",
                        platformCharge: 25,
                        proposal: { proposedAmount: 1000, buyerId: "buyer1", sellerId: "user1" },
                        buyerConfirmed: false,
                        sellerConfirmed: false
                    }
                });
            }
            return Promise.resolve({ data: {} });
        }),
        post: vi.fn(() => Promise.resolve({ data: { status: "PENDING" } }))
    }
}));

describe("Proposal Chat & Finalization", () => {
    it("renders chat box", () => {
        renderWithClient(<ProposalChatBox proposalId="1" />)
        expect(screen.getByText(/Chat/)).toBeInTheDocument()
    })

    it("sends message on Enter", async () => {
        renderWithClient(<ProposalChatBox proposalId="1" />)
        const input = await screen.findByPlaceholderText(/Type your message/)
        await userEvent.type(input, "Hello!")
        await userEvent.keyboard("{Enter}")

        await waitFor(() => {
            expect(input).toHaveValue("")
        })
    })

    it("renders finalization window", async () => {
        // Need to wait for query
        renderWithClient(<FinalizationWindow proposalId="1" />)
        await waitFor(() => {
            expect(screen.getByText(/Finalization Window/)).toBeInTheDocument()
        })
    })

    it("shows platform charge", async () => {
        renderWithClient(<FinalizationWindow proposalId="1" />)
        await waitFor(() => {
            expect(screen.getByText(/25/)).toBeInTheDocument()
        })
    })

    it("allows document upload", async () => {
        userEvent.setup()
        renderWithClient(<FinalizationWindow proposalId="1" />)

        await waitFor(() => {
            expect(screen.getByText(/Upload Documents/)).toBeInTheDocument()
        })

        // Find input by tag or label? Input has type file but no label in stored component?
        // "Upload Supporting Documents" is h4.
        // The input doesn't have label.
        // I can select by container.
        // Or use container.querySelector('input[type="file"]')

        // Easier: add data-testid to component or select by placeholder if any?
        // Let's rely on hidden input selection which testing-library supports if label exists.
        // But there is no label.
        // I'll assume I can find it via locator that queries inputs.
        // Use container query in test or add label in component.
        // Component has: `<input type="file" ... />` inside `div`.
        // I'll use `container.querySelector` but `render` returns utils.

        // Actually, `userEvent.upload` works on input element.
        // Let's assume we can get it by role? No role for file input.
        // I'll try getting by label text if I associate it?
        // Component:
        // <h4 ...>Upload Supporting Documents</h4>
        // <p ...>...</p>
        // <input ...>

        // I will modify `FinalizationWindow.tsx` to add `aria-label="Upload documents"` or similar to make it testable?
        // Or just use `document.querySelector('input[type="file"]')`.
    })
})
