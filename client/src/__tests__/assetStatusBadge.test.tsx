import { render, screen } from "@testing-library/react"
import { AssetStatusBadge } from "@/components/assets/AssetStatusBadge"
import { describe, it, expect } from "vitest"

describe("AssetStatusBadge", () => {
    it("renders DRAFT status", () => {
        render(<AssetStatusBadge status="DRAFT" />)
        expect(screen.getByText("Draft")).toBeInTheDocument()
    })

    it("renders PENDING_REVIEW status", () => {
        render(<AssetStatusBadge status="PENDING_REVIEW" />)
        expect(screen.getByText("Pending Review")).toBeInTheDocument()
    })

    it("renders APPROVED status", () => {
        render(<AssetStatusBadge status="APPROVED" />)
        expect(screen.getByText("Approved")).toBeInTheDocument()
    })

    it("renders REJECTED status with reason", () => {
        render(
            <AssetStatusBadge
                status="REJECTED"
                rejectionReason="Insufficient proof"
            />
        )
        expect(screen.getByText("Rejected")).toBeInTheDocument()
        expect(screen.getByText(/Insufficient proof/)).toBeInTheDocument()
    })

    it("hides rejection reason if not rejected", () => {
        render(<AssetStatusBadge status="APPROVED" rejectionReason="Some reason" />)
        expect(screen.queryByText(/Reason:/)).not.toBeInTheDocument()
    })
})
