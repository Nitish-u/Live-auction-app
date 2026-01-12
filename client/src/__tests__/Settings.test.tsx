import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "@/pages/Settings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { changePassword } from "@/lib/api";
import { ThemeProvider } from "@/components/ThemeProvider";

// Mock API
vi.mock("@/lib/api", () => ({
    changePassword: vi.fn(),
    fetchMyProfile: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <MemoryRouter>
                {children}
            </MemoryRouter>
        </ThemeProvider>
    </QueryClientProvider>
);

describe("Settings Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all sections", () => {
        render(<Settings />, { wrapper: Wrapper });

        expect(screen.getByText("Settings")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Appearance")).toBeInTheDocument();
        expect(screen.getByText("Security")).toBeInTheDocument();
    });

    it("toggles content when tabs are clicked", async () => {
        const user = userEvent.setup();
        render(<Settings />, { wrapper: Wrapper });

        // Default should be profile
        expect(screen.getByText("Public Profile")).toBeInTheDocument();

        // Click Appearance
        const appearanceTab = screen.getByRole("tab", { name: /appearance/i });
        await user.click(appearanceTab);

        await waitFor(() => {
            expect(screen.getByText("Customize the look and feel of the application.")).toBeInTheDocument();
        });

        // Click Security
        const securityTab = screen.getByRole("tab", { name: /security/i });
        await user.click(securityTab);

        await waitFor(() => {
            expect(screen.getByText("Change Password")).toBeInTheDocument();
        });
    });

    it("handles password change submission", async () => {
        const user = userEvent.setup();
        (changePassword as any).mockResolvedValue({ message: "Success" });

        render(<Settings />, { wrapper: Wrapper });

        // Go to security tab
        const securityTab = screen.getByRole("tab", { name: /security/i });
        await user.click(securityTab);

        await waitFor(() => {
            expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
        });

        const currentInput = screen.getByLabelText("Current Password");
        const newInput = screen.getByLabelText("New Password");
        const submitBtn = screen.getByText("Update Password");

        await user.type(currentInput, "oldpass");
        await user.type(newInput, "newlongpassword");
        await user.click(submitBtn);

        await waitFor(() => {
            expect(changePassword).toHaveBeenCalled();
        });

        // React Query might pass extra args, so check the first argument specifically
        expect((changePassword as any).mock.calls[0][0]).toEqual({
            currentPassword: "oldpass",
            newPassword: "newlongpassword"
        });
    });
});
