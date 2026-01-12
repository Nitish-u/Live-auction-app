import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"

interface AdminStats {
    assetsReview: {
        pending: number
    }
    disputes: {
        open: number
    }
    auctions: {
        live: number
    }
    escrows: {
        holding: number
    }
}

export function AdminStatsOverview() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: async () => {
            const response = await api.get("/dashboard/admin")
            return response.data as AdminStats
        }
    })

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!stats) {
        return null
    }

    const statCards = [
        {
            title: "Pending Asset Reviews",
            value: stats.assetsReview.pending,
            color: "bg-orange-50 dark:bg-orange-900/20",
            badge: "warning"
        },
        {
            title: "Open Disputes",
            value: stats.disputes.open,
            color: "bg-red-50 dark:bg-red-900/20",
            badge: "destructive"
        },
        {
            title: "Live Auctions",
            value: stats.auctions.live,
            color: "bg-green-50 dark:bg-green-900/20",
            badge: "success"
        },
        {
            title: "Holding Escrows",
            value: stats.escrows.holding,
            color: "bg-blue-50 dark:bg-blue-900/20",
            badge: "info"
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, idx) => (
                <Card key={idx} className={stat.color}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
