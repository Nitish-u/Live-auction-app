import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AssetStatusBadge } from "@/components/assets/AssetStatusBadge"
import { api } from "@/lib/api"

interface Asset {
    id: string
    title: string
    status: string
    createdAt: string
}

export function RecentAssetsWidget() {
    const navigate = useNavigate()

    const { data: assets, isLoading } = useQuery({
        queryKey: ["my-recent-assets"],
        queryFn: async () => {
            const response = await api.get("/assets/my")
            return response.data.assets
                .sort((a: Asset, b: Asset) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                .slice(0, 5) // Last 5 assets
        }
    })

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Assets</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!assets || assets.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Assets</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        No assets uploaded yet.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Recent Assets</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {assets.map((asset: Asset) => (
                        <div
                            key={asset.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
                            onClick={() => navigate(`/assets/${asset.id}`)}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{asset.title}</p>
                            </div>
                            <AssetStatusBadge status={asset.status as any} />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
