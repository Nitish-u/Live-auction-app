import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface PendingAsset {
    id: string
    title: string
    description: string
    images: string[]
    owner: {
        id: string
        email: string
        displayName?: string
    }
    createdAt: string
}
export function AssetReviewTab() {
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [selectedAsset, setSelectedAsset] = useState<PendingAsset | null>(null)

    const { data: assets, isLoading, refetch } = useQuery({
        queryKey: ["pending-assets"],
        queryFn: async () => {
            const response = await api.get("/admin/assets/pending")
            return response.data as PendingAsset[]
        }
    })

    const handleApprove = async (assetId: string) => {
        setActionLoading(assetId)
        try {
            await api.post(`/admin/assets/${assetId}/approve`)
            toast.success("Asset approved!")
            setSelectedAsset(null) // Close dialog if open
            refetch()
        } catch (error) {
            toast.error("Failed to approve asset")
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (assetId: string) => {
        const reason = prompt("Enter rejection reason:")
        if (!reason) return

        setActionLoading(assetId)
        try {
            await api.post(`/admin/assets/${assetId}/reject`, { reason })
            toast.success("Asset rejected")
            setSelectedAsset(null) // Close dialog if open
            refetch()
        } catch (error) {
            toast.error("Failed to reject asset")
        } finally {
            setActionLoading(null)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="text-center py-12">
                <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-semibold">All Caught Up!</p>
                <p className="text-gray-600 dark:text-gray-400">
                    No pending assets to review
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {assets.length} asset(s) pending review
            </p>

            {/* Compact List View */}
            <div className="space-y-2">
                {assets.map(asset => (
                    <Card key={asset.id} className="overflow-hidden hover:bg-muted/50 transition-colors">
                        <CardContent className="p-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Thumbnail */}
                                <div className="h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                                    <img
                                        src={asset.images && asset.images.length > 0 ? asset.images[0] : "https://via.placeholder.com/150?text=No+Image"}
                                        alt={asset.title}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-sm truncate">{asset.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>By {asset.owner?.displayName || asset.owner?.email || "Unknown"}</span>
                                        <span>•</span>
                                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <Button size="sm" variant="outline" onClick={() => setSelectedAsset(asset)}>
                                Review Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Detailed Review Dialog */}
            {selectedAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Review Asset</h2>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedAsset(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Images Scroll */}
                            {selectedAsset.images && selectedAsset.images.length > 0 ? (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Images ({selectedAsset.images.length})</h4>
                                    <div className="flex gap-4 overflow-x-auto pb-4">
                                        {selectedAsset.images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`Asset ${idx + 1}`}
                                                className="h-48 w-auto rounded-lg object-cover border"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center bg-muted rounded-lg text-muted-foreground">
                                    No Images Uploaded
                                </div>
                            )}

                            {/* Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
                                    <p className="font-medium">{selectedAsset.title}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Owner</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                            {selectedAsset.owner?.displayName?.[0] || "?"}
                                        </div>
                                        <span>{selectedAsset.owner?.displayName || selectedAsset.owner?.email || "Unknown User"}</span>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                                    <p className="text-sm whitespace-pre-wrap">{selectedAsset.description}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">Submitted Date</h4>
                                    <p className="text-sm">{new Date(selectedAsset.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-muted/20 flex justify-end gap-3">
                            <Button
                                variant="destructive"
                                onClick={() => handleReject(selectedAsset.id)}
                                disabled={actionLoading === selectedAsset.id}
                            >
                                {actionLoading === selectedAsset.id ? "Rejecting..." : "Reject Asset"}
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(selectedAsset.id)}
                                disabled={actionLoading === selectedAsset.id}
                            >
                                {actionLoading === selectedAsset.id ? "Approving..." : "Approve Asset"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
