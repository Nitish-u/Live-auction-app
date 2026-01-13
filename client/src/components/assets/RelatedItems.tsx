import { useQuery } from "@tanstack/react-query"
import { AssetCard } from "@/components/AssetCard"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type Asset } from "@/lib/api"

interface RelatedItemsProps {
    sellerId: string
    currentAssetId: string
}

export function RelatedItems({ sellerId, currentAssetId }: RelatedItemsProps) {
    const { data: assets, isLoading } = useQuery({
        queryKey: ["seller-assets", sellerId],
        queryFn: async () => {
            const response = await api.get(`/users/${sellerId}/assets`)
            // Filter out current asset and get first 4
            return response.data.items // Updated to match API response structure
                .filter((a: Asset) => a.id !== currentAssetId && a.status === "APPROVED")
                .slice(0, 4)
        }
    })

    if (isLoading) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">More from this Seller</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    if (!assets || assets.length === 0) {
        return null
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">More from this Seller</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {assets.map((asset: Asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                ))}
            </div>
        </div>
    )
}
