import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight } from "lucide-react"
import { api } from "@/lib/api"

interface Auction {
    id: string
    asset: { title: string }
    status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED"
    startTime: string
    endTime: string
    createdAt: string
}

export function RecentAuctionsTable() {
    const navigate = useNavigate()

    const { data: auctions, isLoading } = useQuery({
        queryKey: ["my-auctions"],
        queryFn: async () => {
            const response = await api.get("/assets/my")
            // The assets endpoint includes auction data. We can filter assets that have auctions.
            // This avoids needing a new backend endpoint for "my auctions".
            const assetsWithAuctions = response.data.assets.filter((asset: any) => asset.auction);

            return assetsWithAuctions
                .map((asset: any) => ({
                    ...asset.auction,
                    asset: { title: asset.title }
                }))
                .filter((a: Auction) => a.status !== "CANCELLED")
                .sort((a: Auction, b: Auction) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                .slice(0, 5) // Last 5 auctions
        }
    })

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Auctions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!auctions || auctions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Auctions</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        No auctions yet. Create one to get started.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Auctions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {auctions.map((auction: Auction) => (
                        <div
                            key={auction.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border hover:border-blue-300 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{auction.asset.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={statusVariant(auction.status)}>
                                        {auction.status}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(auction.startTime)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/auctions/${auction.id}`)}
                            >
                                View
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function statusVariant(
    status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED"
) {
    const variants: Record<string, any> = {
        SCHEDULED: "outline",
        LIVE: "default",
        ENDED: "secondary",
        CANCELLED: "destructive"
    }
    return variants[status] || "outline"
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    })
}
