import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicProfile, fetchSellerAssets, type UserPublicProfile, type Asset } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetCard } from "@/components/AssetCard";
import { Button } from "@/components/ui/button";

export default function PublicProfile() {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<UserPublicProfile | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [assetsLoading, setAssetsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || id === "undefined") return;

        const loadData = async () => {
            setLoading(true);
            setAssetsLoading(true);
            try {
                const profileData = await fetchPublicProfile(id);
                setProfile(profileData);

                const assetsData = await fetchSellerAssets(id, 1, 6);
                setAssets(assetsData.items);
            } catch (err) {
                console.error(err);
                setError("User not found");
            } finally {
                setLoading(false);
                setAssetsLoading(false);
            }
        };

        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 max-w-4xl">
                <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="container mx-auto p-4 text-center text-red-500">
                {error || "User not found"}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border-none shadow-xl">
                <CardHeader className="flex flex-col items-center pb-8 pt-8">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
                        <AvatarImage src={profile.avatarUrl || ""} alt={profile.displayName || "User"} />
                        <AvatarFallback className="text-4xl">{profile.displayName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight">
                        {profile.displayName || "Anonymous User"}
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 mt-2">
                        Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                    {/* Add any badges or stats here if available */}
                </CardHeader>
                <CardContent className="text-center max-w-2xl mx-auto pb-8">
                    {profile.bio ? (
                        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{profile.bio}</p>
                    ) : (
                        <p className="italic text-muted-foreground/50">No bio provided</p>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="assets" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="auctions">Auctions</TabsTrigger>
                </TabsList>

                <TabsContent value="assets" className="space-y-6">
                    {assetsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-64 rounded-xl" />
                            ))}
                        </div>
                    ) : assets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assets.map((asset) => (
                                <div key={asset.id} className="h-[320px]">
                                    <AssetCard asset={asset} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground border rounded-lg bg-muted/20">
                            No publicly listed assets.
                        </div>
                    )}

                    {assets.length > 0 && (
                        <div className="flex justify-center mt-8">
                            <Button variant="outline" asChild>
                                <Link to={`/users/${id}/assets`}>View All Assets</Link>
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="auctions" className="p-12 text-center text-muted-foreground border rounded-lg bg-muted/20">
                    No active auctions.
                </TabsContent>
            </Tabs>
        </div>
    );
}
