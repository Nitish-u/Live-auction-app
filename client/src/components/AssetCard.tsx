import { useNavigate } from "react-router-dom";
import type { Asset } from "../lib/api";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { AssetStatusBadge } from "./assets/AssetStatusBadge";

interface AssetCardProps {
    asset: Asset;
}

export const AssetCard = ({ asset }: AssetCardProps) => {
    const navigate = useNavigate();

    // hasAuction was unused
    const isLive = asset.auction?.status === "LIVE";
    const isScheduled = asset.auction?.status === "SCHEDULED";
    const isEnded = asset.auction?.status === "ENDED";

    let badge = null;
    if (isLive) {
        badge = <Badge variant="destructive" className="animate-pulse">Live Auction</Badge>;
    } else if (isScheduled) {
        badge = <Badge variant="secondary">Scheduled</Badge>;
    } else if (isEnded) {
        badge = <Badge variant="outline">Auction Ended</Badge>;
    } else {
        badge = <Badge variant="outline">Not Auctioned</Badge>;
    }

    return (
        <Card
            className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-none bg-card/50 backdrop-blur-sm group h-full flex flex-col cursor-pointer"
            onClick={() => navigate(`/assets/${asset.id}`)}
        >
            <div className="h-32 w-full overflow-hidden relative">
                {asset.images[0] ? (
                    <img
                        src={asset.images[0]}
                        alt={asset.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-gray-100 dark:bg-gray-800 text-xs">
                        No Image
                    </div>
                )}
                {badge && (
                    <div className="absolute top-1 left-1 scale-75 origin-top-left">
                        {badge}
                    </div>
                )}
                <div className="absolute top-1 right-1 z-10 scale-75 origin-top-right">
                    <AssetStatusBadge status={asset.status} rejectionReason={asset.rejectionReason} />
                </div>
            </div>

            <CardContent className="p-3 flex-1 flex flex-col justify-between">
                <div className="mb-1">
                    <h3 className="font-semibold text-sm truncate leading-tight" title={asset.title}>{asset.title}</h3>
                </div>
            </CardContent>

            <CardFooter className="p-3 pt-0 flex items-center gap-2 mt-auto">
                <div
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card navigation
                        navigate(`/users/${asset.owner.id}/assets`);
                    }}
                    className="flex items-center gap-2 group/seller max-w-full hover:underline decoration-primary cursor-pointer"
                >
                    {asset.owner?.id ? (
                        <>
                            <Avatar className="h-5 w-5 border border-border">
                                <AvatarImage src={asset.owner.avatarUrl || undefined} />
                                <AvatarFallback className="text-[9px]">{asset.owner.displayName?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium truncate">
                                    {asset.owner.displayName || "Unknown"}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 max-w-full">
                            <Avatar className="h-5 w-5 border border-border">
                                <AvatarFallback className="text-[9px]">?</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">
                                Unknown
                            </span>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};
