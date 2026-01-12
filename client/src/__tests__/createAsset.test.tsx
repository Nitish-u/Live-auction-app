import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CreateAssetForm } from "@/components/assets/CreateAssetForm"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { BrowserRouter } from "react-router-dom"
import { toast } from "sonner"
import { api } from "@/lib/api"

// Mock api
vi.mock("@/lib/api", () => ({
    api: {
        post: vi.fn()
    }
}))

// Mock toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}))

// Mock AssetUploadInput
vi.mock("@/components/assets/AssetUploadInput", () => ({
    AssetUploadInput: ({ onUpload }: { onUpload: (urls: string[]) => void }) => (
        <button type="button" onClick={() => onUpload(["http://fake.url/img.jpg"])}>
            Mock Upload
        </button>
    )
}))

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe("CreateAssetForm", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders form fields", () => {
        renderWithRouter(<CreateAssetForm />)
        expect(screen.getByPlaceholderText(/Vintage Oak Chair/)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Describe your item/)).toBeInTheDocument()
    })

    it("validates required fields", async () => {
        renderWithRouter(<CreateAssetForm />)

        const titleInput = screen.getByPlaceholderText(/Vintage Oak Chair/)
        fireEvent.change(titleInput, { target: { value: "A" } })
        fireEvent.blur(titleInput)

        await waitFor(() => {
            expect(screen.getByText(/Title must be at least 3 characters/i)).toBeInTheDocument()
        })
    })

    it("requires at least one image", async () => {
        renderWithRouter(<CreateAssetForm />)
        fireEvent.change(screen.getByPlaceholderText(/Vintage Oak Chair/), {
            target: { value: "Test Asset" }
        })

        const submitButton = screen.getByText("Create Asset")
        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/Please upload at least one image/)).toBeInTheDocument()
    })

    it("submits successfully with valid data", async () => {
        const onSuccess = vi.fn()
            ; (api.post as any).mockResolvedValueOnce({ data: {} })

        renderWithRouter(<CreateAssetForm onSuccess={onSuccess} />)

        // Upload Image
        fireEvent.click(screen.getByText("Mock Upload"))

        // Fill Form
        fireEvent.change(screen.getByPlaceholderText(/Vintage Oak Chair/), { target: { value: "Valid Title" } })
        fireEvent.change(screen.getByPlaceholderText(/Describe your item/), { target: { value: "Valid Description Validation" } })

        // Wait for button to be enabled
        const submitButton = screen.getByText("Create Asset")
        expect(submitButton).not.toBeDisabled()

        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledTimes(1)
            expect(api.post).toHaveBeenCalledWith("/assets", expect.objectContaining({
                title: "Valid Title",
                description: "Valid Description Validation",
                images: ["http://fake.url/img.jpg"]
            }))
            expect(toast.success).toHaveBeenCalled()
            expect(onSuccess).toHaveBeenCalled()
        })
    })
})
