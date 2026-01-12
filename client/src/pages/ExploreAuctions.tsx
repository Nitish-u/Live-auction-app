import { useQuery } from "@tanstack/react-query";
import { fetchAuctions } from "../lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchX } from "lucide-react";

export const ExploreAuctions = () => {
    const [status, setStatus] = useState<"SCHEDULED" | "LIVE" | undefined>(undefined);
    const [sortBy, setSortBy] = useState<"startTime" | "endTime">("startTime");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["auctions", { status, sortBy }],
        queryFn: () => fetchAuctions({ status, sortBy, limit: 12 }),
    });

    if (isError) return <div className="p-8 text-red-500">Failed to load auctions</div>;

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Explore Auctions</h1>
                <div className="flex gap-4">
                    <Select onValueChange={(v) => setStatus(v === "ALL" ? undefined : v as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            <SelectItem value="LIVE">Live</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select onValueChange={(v) => setSortBy(v as any)} defaultValue="startTime">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="startTime">Start Time</SelectItem>
                            <SelectItem value="endTime">End Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.data?.map((auction) => (
                        <Card key={auction.id} className="overflow-hidden">
                            <div className="aspect-video relative overflow-hidden bg-muted">
                                {auction.asset.images[0] && (
                                    <img
                                        src={auction.asset.images[0]}
                                        alt={auction.asset.title}
                                        className="object-cover w-full h-full transition-transform hover:scale-105"
                                    />
                                )}
                            </div>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="line-clamp-1">{auction.asset.title}</CardTitle>
                                    <Badge variant={auction.status === "LIVE" ? "destructive" : "secondary"}>
                                        {auction.status}
                                    </Badge>
                                </div>
                                <CardDescription>
                                    Seller: {auction.seller.displayName || auction.seller.email}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    Starts: {new Date(auction.startTime).toLocaleString()}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link to={`/auctions/${auction.id}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && (data?.data?.length === 0 || !data?.data) && (
                <div className="py-12">
                    <EmptyState
                        icon={SearchX}
                        title="No auctions found"
                        description={
                            status || sortBy !== "startTime"
                                ? "Try adjusting your filters to find what you're looking for."
                                : "There are no active auctions at the moment. Check back later!"
                        }
                        action={
                            (status || sortBy !== "startTime") ? (
                                <Button variant="outline" onClick={() => {
                                    setStatus(undefined);
                                    setSortBy("startTime");
                                }}>
                                    Clear Filters
                                </Button>
                            ) : undefined
                        }
                    />
                </div>
            )}
        </div>
    );
};
