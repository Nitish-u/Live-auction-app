import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Clock } from "lucide-react"
import { api } from "@/lib/api"

interface Bid {
    id: string
    amount: number
    auction: {
        id: string
        asset: { title: string }
        endTime: string
        status: string
    }
}

export function ActiveBidsTable() {
    const navigate = useNavigate()
    const [countdowns, setCountdowns] = useState<Record<string, string>>({})

    const { data: bids, isLoading } = useQuery({
        queryKey: ["my-active-bids"],
        queryFn: async () => {
            const response = await api.get("/bids")
            // Filter for active bids only (auction is LIVE)
            return response.data
                .filter((bid: Bid) => bid.auction.status === "LIVE")
                .sort((a: Bid, b: Bid) =>
                    new Date(b.auction.endTime).getTime() -
                    new Date(a.auction.endTime).getTime()
                )
                .slice(0, 5)
        }
    })

    // Update countdowns every second
    useEffect(() => {
        if (!bids) return

        const updateCountdowns = () => {
            const newCountdowns: Record<string, string> = {}
            bids.forEach((bid: Bid) => {
                const endTime = new Date(bid.auction.endTime)
                const now = new Date()
                const diff = endTime.getTime() - now.getTime()

                if (diff <= 0) {
                    newCountdowns[bid.id] = "Ended"
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60))
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

                    if (hours > 0) {
                        newCountdowns[bid.id] = `${hours}h ${minutes}m`
                    } else if (minutes > 0) {
                        newCountdowns[bid.id] = `${minutes}m ${seconds}s`
                    } else {
                        newCountdowns[bid.id] = `${seconds}s`
                    }
                }
            })
            setCountdowns(newCountdowns)
        }

        updateCountdowns() // Initial call
        const interval = setInterval(updateCountdowns, 1000)

        return () => clearInterval(interval)
    }, [bids])

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Bids</CardTitle>
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

    if (!bids || bids.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Bids</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        No active bids. Explore auctions to bid.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Bids</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {bids.map((bid: Bid) => (
                        <div
                            key={bid.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border hover:border-blue-300 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{bid.auction.asset.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Your bid: ${bid.amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-sm font-medium text-orange-600 dark:text-orange-400">
                                    <Clock className="w-4 h-4" />
                                    {countdowns[bid.id] || "..."}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/auctions/${bid.auction.id}`)}
                                >
                                    Bid
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
