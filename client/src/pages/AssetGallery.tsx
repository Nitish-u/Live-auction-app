import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "../lib/api";
import { AssetCard } from "../components/AssetCard";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Telescope } from "lucide-react";

export const AssetGallery = () => {
    const [page, setPage] = useState(1);
    const LIMIT = 12;

    const { data, isLoading, isError } = useQuery({
        queryKey: ["assets", page],
        queryFn: () => fetchAssets({ page, limit: LIMIT }),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    });

    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => (data && p < data.totalPages ? p + 1 : p));

    if (isError) {
        return (
            <div className="container py-8 text-center text-red-500">
                Failed to load assets. Please try again later.
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Project Gallery</h1>
                    <p className="text-muted-foreground mt-1">Discover unique assets from our community</p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {data?.items.length === 0 ? (
                        <div className="py-20">
                            <EmptyState
                                icon={Telescope}
                                title="No assets found"
                                description="We couldn't find any assets in the gallery. Check back later for new listings."
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {data?.items.map((asset) => (
                                <AssetCard key={asset.id} asset={asset} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {data && data.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <Button
                                variant="outline"
                                onClick={handlePrev}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-medium">
                                Page {page} of {data.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={handleNext}
                                disabled={page === data.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
