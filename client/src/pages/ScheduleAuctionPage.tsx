import { useAuth } from "@/hooks/useAuth"
import { ScheduleAuctionForm } from "@/components/auctions/ScheduleAuctionForm"

export function ScheduleAuctionPage() {
    const { user } = useAuth()

    // Ensure user is authenticated
    if (!user) {
        return (
            <div className="text-center py-12">
                <p>Please log in to schedule an auction.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <ScheduleAuctionForm />
        </div>
    )
}
