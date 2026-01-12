import { useQuery } from "@tanstack/react-query";
import { fetchSellerAssets, fetchMyAssets } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetCard } from "@/components/AssetCard";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

interface AssetSectionProps {
    userId: string;
    isOwnProfile: boolean;
}

export function AssetSection({ userId, isOwnProfile }: AssetSectionProps) {
    const { data, isLoading } = useQuery({
        queryKey: ["sellerAssets", userId],
        queryFn: () => fetchSellerAssets(userId, 1, 100), // Fetch all (up to 100) for now
    });

    const { data: myAssetsData, isLoading: isMyAssetsLoading } = useQuery({
        queryKey: ["myAssets"],
        queryFn: fetchMyAssets,
        enabled: isOwnProfile,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
                ))}
            </div>
        );
    }

    const publicAssets = data?.items || [];
    const draftAssets = isOwnProfile ? (myAssetsData?.filter(a => a.status === "DRAFT" || a.status === "PENDING_REVIEW") || []) : [];

    return (
        <div className="space-y-6">
            <Tabs defaultValue="public" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="public">Public Assets ({publicAssets.length})</TabsTrigger>
                        {isOwnProfile && (
                            <TabsTrigger value="drafts">Drafts & Pending ({draftAssets.length})</TabsTrigger>
                        )}
                    </TabsList>

                    {isOwnProfile && (
                        <Button size="sm" variant="outline" asChild>
                            <Link to="/create-asset">
                                <Plus className="w-4 h-4 mr-2" />
                                New Asset
                            </Link>
                        </Button>
                    )}
                </div>

                <TabsContent value="public" className="space-y-4">
                    {publicAssets.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground">No public assets found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {/* Reduced cols for layout fit since it shares width with proposals? 
                                No, layout is: Top Header, Bottom Left Assets, Bottom Right Proposals.
                                Wait, Spec: "Assets (Left) | Proposals (Right)"
                                So AssetsSection is in a column. 2 columns is probably max in that space.
                             */}
                            {publicAssets.map((asset) => (
                                <AssetCard key={asset.id} asset={asset} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {isOwnProfile && (
                    <TabsContent value="drafts" className="space-y-4">
                        {isMyAssetsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                {[1, 2].map((i) => (
                                    <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                {draftAssets.map((asset) => (
                                    <div key={asset.id} className="relative group">
                                        <AssetCard asset={asset} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
