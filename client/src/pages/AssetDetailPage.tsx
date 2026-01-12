import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { ImageCarousel } from "@/components/assets/ImageCarousel"
import { SellerCard } from "@/components/assets/SellerCard"
import { AuctionStatus } from "@/components/assets/AuctionStatus"
import { MetadataDisplay } from "@/components/assets/MetadataDisplay"
import { RelatedItems } from "@/components/assets/RelatedItems"
import { AssetStatusBadge } from "@/components/assets/AssetStatusBadge"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ProposalForm } from "@/components/proposals/ProposalForm"
import { ProposalsList } from "@/components/proposals/ProposalsList"

interface Asset {
    id: string
    title: string
    description: string
    images: string[]
    metadata?: Record<string, unknown>
    status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
    rejectionReason?: string
    owner: {
        id: string
        email: string
        displayName?: string
        avatarUrl?: string
    }
}

interface Auction {
    id: string
    status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED"
    startTime: string
    endTime: string
}

export function AssetDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const { data: asset, isLoading: assetLoading, error: assetError } = useQuery({
        queryKey: ["asset", id],
        queryFn: async () => {
            const response = await api.get(`/assets/${id}`)
            return response.data as Asset
        },
        enabled: !!id
    })

    const { data: auction } = useQuery({
        queryKey: ["asset-auction", id],
        queryFn: async () => {
            try {
                const response = await api.get("/auctions", {
                    params: { assetId: id }
                })
                return response.data?.data?.[0] as Auction | undefined
            } catch {
                return undefined
            }
        },
        enabled: !!id && asset?.status === "APPROVED"
    })

    const refetchProposals = () => {
        queryClient.invalidateQueries({ queryKey: ["/proposals/my-sent"] })
        queryClient.invalidateQueries({ queryKey: ["/proposals/my-assets"] })
    }

    if (assetError) {
        return (
            <div className="container mx-auto py-8">
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-4">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                        <h2 className="font-semibold text-red-800 dark:text-red-200">Asset Not Found</h2>
                        <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                            This asset doesn't exist or has been removed.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/explore/assets")}
                            className="mt-4"
                        >
                            Back to Gallery
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (assetLoading) {
        return (
            <div className="container mx-auto py-8">
                <Skeleton className="w-24 h-8 mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Skeleton className="aspect-square rounded-lg mb-4" />
                        <Skeleton className="h-12 w-full mb-4" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (!asset) {
        return null
    }

    return (
        <div className="container mx-auto py-8 space-y-8 px-4">
            {/* Back button */}
            <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Image + Details */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Image carousel */}
                    <ImageCarousel images={asset.images} title={asset.title} />

                    {/* Title + Status */}
                    <div>
                        <div className="flex items-start justify-between mb-3 gap-4">
                            <h1 className="text-4xl font-bold">{asset.title}</h1>
                            <div className="flex-shrink-0">
                                <AssetStatusBadge
                                    status={asset.status}
                                    rejectionReason={asset.rejectionReason}
                                />
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Listed by {asset.owner.displayName || asset.owner.email}
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-xl font-semibold mb-3">About This Item</h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {asset.description}
                        </p>
                    </div>

                    {/* Metadata */}
                    <MetadataDisplay metadata={asset.metadata} />
                </div>

                {/* Right: Sidebar */}
                <div className="space-y-6">

                    {/* Auction status */}
                    <AuctionStatus auction={auction} assetStatus={asset.status} />

                    {/* Seller card */}
                    <SellerCard seller={asset.owner} />
                </div>
            </div>

            {/* Proposals section */}
            {asset.status === "APPROVED" && (
                <div className="border-t pt-8">
                    <h2 className="text-2xl font-bold mb-6">Make an Offer</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Buyer side: Proposal form */}
                        {user?.id !== asset.owner.id && (
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Propose an Amount</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ProposalForm
                                            assetId={asset.id}
                                            sellerId={asset.owner.id}
                                            onSuccess={refetchProposals}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Seller side: Incoming proposals */}
                        {user?.id === asset.owner.id && (
                            <div className="lg:col-span-2">
                                <h3 className="font-semibold mb-4">Incoming Offers</h3>
                                <ProposalsList assetId={asset.id} isSeller={true} />
                            </div>
                        )}

                        {/* Buyer side: My proposals */}
                        {user?.id !== asset.owner.id && (
                            <div>
                                <h3 className="font-semibold mb-4">My Offers</h3>
                                <ProposalsList assetId={asset.id} isSeller={false} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Related items */}
            {asset.status === "APPROVED" && (
                <div className="border-t pt-8">
                    <RelatedItems sellerId={asset.owner.id} currentAssetId={asset.id} />
                </div>
            )}
        </div>
    )
}


