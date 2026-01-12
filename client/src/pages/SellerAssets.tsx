import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSellerAssets, fetchPublicProfile } from "../lib/api";
import { AssetCard } from "../components/AssetCard";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { BoxSelect } from "lucide-react";

export const SellerAssets = () => {
    const { id } = useParams<{ id: string }>();
    const [page, setPage] = useState(1);
    const LIMIT = 12;

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ["user", id],
        queryFn: () => fetchPublicProfile(id!),
        enabled: !!id && id !== "undefined",
    });

    const { data: assets, isLoading: isAssetsLoading } = useQuery({
        queryKey: ["seller-assets", id, page],
        queryFn: () => fetchSellerAssets(id!, page, LIMIT),
        enabled: !!id && id !== "undefined",
        placeholderData: (previousData) => previousData,
    });

    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => (assets && p < assets.totalPages ? p + 1 : p));

    if (!id) return <div>Invalid URL</div>;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Seller Header */}
            {isProfileLoading ? (
                <div className="flex items-center gap-4 py-6 border-b">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                </div>
            ) : profile ? (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 py-6 border-b">
                    <Avatar className="h-20 w-20 border-2 border-primary/20">
                        <AvatarImage src={profile.avatarUrl || undefined} />
                        <AvatarFallback className="text-xl">{profile.displayName?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">{profile.displayName || "Unknown User"}</h1>
                        <p className="text-muted-foreground">{profile.bio || "No bio available"}</p>
                        <p className="text-xs text-muted-foreground">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            ) : (
                <div className="py-8 text-red-500">User not found</div>
            )}

            {/* Assets Grid */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Gallery</h2>
                {isAssetsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <>
                        {assets?.items.length === 0 ? (
                            <div className="py-20">
                                <EmptyState
                                    icon={BoxSelect}
                                    title="No assets found"
                                    description="This user hasn't showcased any assets yet."
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {assets?.items.map((asset) => (
                                    <AssetCard key={asset.id} asset={asset} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {assets && assets.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-medium">
                                    Page {page} of {assets.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={handleNext}
                                    disabled={page === assets.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
