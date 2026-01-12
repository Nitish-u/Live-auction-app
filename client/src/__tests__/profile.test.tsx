import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, beforeEach, vi } from "vitest";
import MyProfile from "../pages/MyProfile";

// Mock the API hooks
vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual("@/lib/api");
    return {
        ...actual,
        fetchMyProfile: vi.fn().mockResolvedValue({
            id: "user-123",
            email: "test@example.com",
            displayName: "Test User",
            avatarUrl: "https://example.com/avatar.jpg",
            bio: "This is a test bio",
            createdAt: "2023-01-01T00:00:00Z",
            role: "user"
        }),
        fetchSellerAssets: vi.fn().mockResolvedValue({
            items: [
                {
                    id: "asset-1",
                    title: "Public Asset 1",
                    images: ["img1.jpg"],
                    owner: { id: "user-123", displayName: "Test User" },
                    auction: { status: "SCHEDULED" }
                }
            ],
            totalPages: 1,
            page: 1,
            totalItems: 1
        }),
        fetchIncomingProposals: vi.fn().mockResolvedValue({
            proposals: [
                {
                    id: "prop-1",
                    assetTitle: "Proposal Asset",
                    buyerName: "Buyer Bo",
                    buyerAvatar: "",
                    proposedAmount: "100.00",
                    status: "PENDING",
                    createdAt: "2023-01-02T00:00:00Z"
                }
            ]
        }),
        updateMyProfile: vi.fn().mockResolvedValue({}),
    };
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithProviders = (ui: React.ReactNode) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{ui}</MemoryRouter>
        </QueryClientProvider>
    );
};

describe("Feature 22 - Enhanced Profile Page", () => {
    beforeEach(() => {
        queryClient.clear();
        vi.clearAllMocks();
    });

    test("Profile page loads and displays user info", async () => {
        renderWithProviders(<MyProfile />);

        await waitFor(() => {
            expect(screen.getByText("Test User")).toBeInTheDocument();
            expect(screen.getByText("test@example.com")).toBeInTheDocument();
            expect(screen.getByText("This is a test bio")).toBeInTheDocument();
        });
    });

    test("Displays two-column layout sections: Assets and Proposals", async () => {
        renderWithProviders(<MyProfile />);

        await waitFor(() => {
            expect(screen.getByText(/Public Assets/)).toBeInTheDocument();
            expect(screen.getByText("Incoming Proposals")).toBeInTheDocument();
        });
    });

    test("Displays public assets correctly", async () => {
        renderWithProviders(<MyProfile />);

        await waitFor(() => {
            expect(screen.getByText("Public Asset 1")).toBeInTheDocument();
        });
    });

    // Use userEvent for interaction test
    test("Displays draft assets tab and items (Mocked in component)", async () => {
        const user = userEvent.setup();
        renderWithProviders(<MyProfile />);

        await waitFor(() => {
            expect(screen.getByText(/Drafts & Pending/i)).toBeInTheDocument();
        });

        const draftTab = screen.getByText(/Drafts & Pending/i);
        await user.click(draftTab);

        // Check for mock draft content
        await waitFor(() => {
            expect(screen.getByText("Unfinished Painting (Draft)")).toBeInTheDocument();
        });
    });

    test("Displays dummy incoming proposals", async () => {
        renderWithProviders(<MyProfile />);

        await waitFor(() => {
            expect(screen.getByText("Buyer Bo offered $100.00")).toBeInTheDocument();
            expect(screen.getByText("for Proposal Asset")).toBeInTheDocument();
        });
    });

    test("Edit Profile dialog opens", async () => {
        const user = userEvent.setup();
        renderWithProviders(<MyProfile />);

        await waitFor(() => expect(screen.getByText("Edit Profile")).toBeInTheDocument());

        await user.click(screen.getByText("Edit Profile"));

        await waitFor(() => {
            expect(screen.getByRole("dialog")).toBeInTheDocument();
            expect(screen.getByLabelText("Display Name")).toHaveValue("Test User");
        });
    });
});
