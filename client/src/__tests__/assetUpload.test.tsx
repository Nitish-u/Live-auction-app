import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AssetUploadInput } from "@/components/assets/AssetUploadInput"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { vi, describe, it, expect, beforeEach } from "vitest"

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

describe("AssetUploadInput", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders upload zone", () => {
        render(<AssetUploadInput onUpload={vi.fn()} />)
        expect(screen.getByText(/Drag and drop/)).toBeInTheDocument()
    })

    it("accepts file selection", async () => {
        const onUpload = vi.fn()
        render(<AssetUploadInput onUpload={onUpload} />)

        // Find hidden input
        // The label calls for file-input
        const input = document.getElementById("file-input") as HTMLInputElement
        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })

        fireEvent.change(input, { target: { files: [file] } })

        await waitFor(() => {
            expect(screen.getByText("test.jpg")).toBeInTheDocument()
        })
    })

    it("uploads files successfully", async () => {
        const onUpload = vi.fn()
            // Mock return value structure: { data: { urls: [...] } }
            ; (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                data: { urls: ["http://test.com/img.jpg"] }
            })

        render(<AssetUploadInput onUpload={onUpload} />)

        const input = document.getElementById("file-input") as HTMLInputElement
        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
        fireEvent.change(input, { target: { files: [file] } })

        await waitFor(() => screen.getByText("test.jpg"))

        const uploadBtn = screen.getByText("Upload Images")
        fireEvent.click(uploadBtn)

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled()
            expect(onUpload).toHaveBeenCalledWith(["http://test.com/img.jpg"])
            expect(toast.success).toHaveBeenCalled()
        })
    })
})
