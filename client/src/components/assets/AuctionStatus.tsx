import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle } from "lucide-react"

interface Auction {
    id: string
    status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED"
    startTime: string
    endTime: string
}

interface AuctionStatusProps {
    auction?: Auction
    assetStatus: string
}

export function AuctionStatus({ auction, assetStatus }: AuctionStatusProps) {
    if (assetStatus !== "APPROVED") {
        return (
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-6">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ This asset is under admin review. Check back soon!
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (!auction) {
        return (
            <Card className="bg-gray-50 dark:bg-gray-900">
                <CardContent className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        No active auction scheduled for this item yet.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const startTime = new Date(auction.startTime)
    const endTime = new Date(auction.endTime)

    let statusColor = "bg-gray-50"
    let statusIcon = null
    let statusText = ""

    if (auction.status === "CANCELLED") {
        statusColor = "bg-red-50 dark:bg-red-900/20"
        statusIcon = <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        statusText = "This auction was cancelled"
    } else if (auction.status === "LIVE") {
        statusColor = "bg-green-50 dark:bg-green-900/20"
        statusIcon = <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        statusText = `Live! Ends ${formatTime(endTime)}`
    } else if (auction.status === "SCHEDULED") {
        statusColor = "bg-blue-50 dark:bg-blue-900/20"
        statusIcon = <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        statusText = `Starts ${formatTime(startTime)}`
    } else if (auction.status === "ENDED") {
        statusColor = "bg-gray-50 dark:bg-gray-900"
        statusText = "This auction has ended"
    }

    return (
        <Card className={statusColor}>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    {statusIcon}
                    Auction Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Badge variant={auction.status === "LIVE" ? "default" : "secondary"}>
                        {auction.status}
                    </Badge>
                    <p className="text-sm mt-2">{statusText}</p>
                </div>

                {auction.status === "LIVE" && (
                    <Button className="w-full" asChild>
                        <Link to={`/auctions/${auction.id}`}>
                            View & Bid on Auction
                        </Link>
                    </Button>
                )}

                {auction.status === "SCHEDULED" && (
                    <Button variant="outline" className="w-full" asChild>
                        <Link to={`/auctions/${auction.id}`}>
                            View Auction Details
                        </Link>
                    </Button>
                )}

                {auction.status === "ENDED" && (
                    <Button variant="outline" className="w-full" asChild>
                        <Link to={`/auctions/${auction.id}`}>
                            View Results
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

function formatTime(date: Date): string {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `in ${days}d ${hours}h`
    if (hours > 0) return `in ${hours}h`
    return "soon"
}
