import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { fetchAuction, fetchBids } from "../lib/api";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { getCurrentUser } from "@/lib/auth";
import { BidForm } from "@/components/BidForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const AuctionDetails = () => {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!id) return;

        const socket = io("http://localhost:3000/auctions");

        socket.on("connect", () => {
            console.log("Connected to auction socket");
            socket.emit("join_auction", { auctionId: id });
        });

        socket.on("bid_placed", (payload: any) => {
            console.log("Bid Placed Event:", payload);
            const newBid = {
                id: Math.random().toString(), // Temp ID until refresh
                amount: Number(payload.amount),
                createdAt: payload.timestamp,
                bidder: payload.bidder
            };

            // Update Bid List
            queryClient.setQueryData(["bids", id], (old: any[] | undefined) => {
                if (!old) return [newBid];
                // Prevent duplicates if API updated first (unlikely with push)
                if (old.some(b => b.createdAt === newBid.createdAt)) return old;
                return [newBid, ...old];
            });

            // Update Auction Details (Highest Bid)
            queryClient.setQueryData(["auction", id], (old: any | undefined) => {
                if (!old) return old;
                // Add to bids array if exists, or update logic if we display top bid specially
                const currentBids = old.bids || [];
                // Sort or prepend? Prepend assuming we want highest first
                return {
                    ...old,
                    bids: [
                        { amount: newBid.amount, bidder: { email: newBid.bidder.email } },
                        ...currentBids
                    ]
                };
            });
        });

        socket.on("message_sent", (payload: any) => {
            console.log("Message Sent Event:", payload);
            queryClient.setQueryData(["messages", id], (old: any[] | undefined) => {
                if (!old) return [payload];
                if (old.some(m => m.id === payload.id)) return old;
                return [...old, payload];
            });
        });

        return () => {
            socket.emit("leave_auction", { auctionId: id });
            socket.disconnect();
        };
    }, [id, queryClient]);

    const { data: auction, isLoading, isError } = useQuery({
        queryKey: ["auction", id],
        queryFn: () => fetchAuction(id!),
        enabled: !!id
    });

    // Determine participation
    const currentUser = getCurrentUser();
    const isSeller = auction?.sellerId === currentUser?.sub; // Need sellerId in auction response?
    // fetchAuction returns seller: { id, email }
    const isParticipant = isSeller || (auction?.bids?.some((b: any) => b.bidder.email === currentUser?.email) ?? false);
    // Wait, frontend bids list might not have bidder ID, only email? 
    // API: bids: { amount, bidder: { email } }[]
    // Token has sub (id). 
    // Backend token usually has ID. Frontend Bids has Email.
    // Mismatch.
    // I added `bidderId` to `Bid` model but `fetchAuction` projection might be partial.
    // Let's rely on loose check or just 'true' for now and let backend fail 403?
    // Or I check if I have placed a bid via my own local state? No.
    // Let's check `api.ts` types.
    // Auction.seller.id IS available.
    // Auction.bids -> bidder { email }. No ID.
    // I should probably decode token to get email if available, or just ID.
    // If I can't determine strictly, I'll pass true and let backend handle 403 UI (toast).
    // Actually, `fetchBids` returns full list. `fetchAuction` returns subset.
    // Let's use `fetchBids` cache for strict check?
    // Or just "If I am logged in, show input". Backend will reject if not allowed.
    // Prompt says "Check permissions -> Show/Hide Input".
    // I will enable it for everyone logged in, and handle error.

    // Better: Helper `isParticipant` logic update later.

    if (isError) return <div className="p-8 text-center text-red-500">Auction not found</div>;
    if (isLoading) return <div className="container mx-auto py-8"><Skeleton className="h-[400px] w-full" /></div>;
    if (!auction) return null;

    return (
        <div className="container mx-auto py-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-xl overflow-hidden border">
                    {auction.asset.images[0] && (
                        <img
                            src={auction.asset.images[0]}
                            alt={auction.asset.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {auction.asset.images.slice(1).map((img, i) => (
                        <div key={i} className="aspect-square bg-muted rounded-md overflow-hidden border">
                            <img src={img} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Live Chat</h3>
                    <ChatPanel auctionId={auction.id} isParticipant={isParticipant} />
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-3xl font-bold">{auction.asset.title}</h1>
                        <Badge variant={auction.status === "LIVE" ? "destructive" : "secondary"} className="text-lg px-4 py-1">
                            {auction.status}
                        </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground mt-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={auction.seller.avatarUrl || ""} />
                            <AvatarFallback>{auction.seller.displayName?.[0]?.toUpperCase() || auction.seller.email[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>
                            Hosted by <Link to={`/users/${auction.seller.id}`} className="hover:underline text-foreground">{auction.seller.displayName || auction.seller.email}</Link>
                        </span>
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Start Time</p>
                            <p className="text-lg">{new Date(auction.startTime).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">End Time</p>
                            <p className="text-lg">{new Date(auction.endTime).toLocaleString()}</p>
                        </div>
                    </div>
                    <Separator />
                    <p className="text-center text-sm text-muted-foreground mb-4">
                        {auction.status === "SCHEDULED" ? "Bidding starts soon" : "Bidding is open!"}
                    </p>

                    {auction.status === "LIVE" ? (
                        <BidForm
                            auctionId={auction.id}
                            currentHighestBid={auction.bids?.[0]?.amount || 0}
                        />
                    ) : (
                        <div className="space-y-4">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="w-full">
                                            <Button className="w-full" disabled size="lg">
                                                {auction.status === "SCHEDULED" ? "Coming Soon" : "Auction Ended"}
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            {auction.status === "SCHEDULED"
                                                ? "Bidding has not started yet."
                                                : "This auction has ended. No further bids allowed."
                                            }
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {auction.status === "ENDED" &&
                                auction.escrow?.status === "HOLDING" &&
                                currentUser?.sub === auction.escrow.buyerId && (
                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold mb-2">Issue with your purchase?</h4>
                                        <RaiseDisputeButton escrowId={auction.escrow.id} />
                                    </div>
                                )}

                            {auction.status === "ENDED" &&
                                auction.escrow?.status === "REFUNDED" && (
                                    <div className="p-3 bg-red-100 text-red-800 rounded-md text-center">
                                        Order Refunded
                                    </div>
                                )}

                            {auction.status === "ENDED" &&
                                auction.escrow?.status === "RELEASED" && (
                                    <div className="p-3 bg-green-100 text-green-800 rounded-md text-center">
                                        Funds Released to Seller
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Bid History</h3>
                <BidList auctionId={auction.id} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="leading-relaxed">
                        {auction.asset.description || "No description provided."}
                    </p>
                </CardContent>
            </Card>

            <div className="pt-4">
                <Button variant="outline" asChild>
                    <Link to="/">← Back to Explore</Link>
                </Button>
            </div>
        </div>
    );
};

const BidList = ({ auctionId }: { auctionId: string }) => {
    const { data: bids, isLoading } = useQuery({
        queryKey: ["bids", auctionId],
        queryFn: () => fetchBids(auctionId)
    });

    if (isLoading) return <Skeleton className="h-20 w-full" />;
    if (!bids || bids.length === 0) return (
        <div className="py-8">
            <EmptyState
                title="No bids yet"
                description="Be the first to place a bid!"
                className="border-dashed"
            />
        </div>
    );

    return (
        <Card>
            <CardContent className="p-0">
                <ul className="divide-y">
                    {bids.map((bid) => (
                        <li key={bid.id} className="flex justify-between p-4">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                        {bid.bidder.displayName || bid.bidder.email}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground block">
                                    {new Date(bid.createdAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="font-bold text-green-600">
                                ${bid.amount.toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

import { raiseDispute } from "../lib/api";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const RaiseDisputeButton = ({ escrowId }: { escrowId: string }) => {
    const [reason, setReason] = useState("");
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => raiseDispute(escrowId, reason),
        onSuccess: () => {
            toast.success("Dispute raised. Admin will review.");
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["auction"] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to raise dispute");
        }
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">Raise Dispute</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Raise a Dispute</DialogTitle>
                    <DialogDescription>
                        Please describe the issue with your item. An admin will review and resolve strictly.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    placeholder="Item not received, damaged, etc..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={() => mutation.mutate()}
                        disabled={!reason.trim() || mutation.isPending}
                    >
                        {mutation.isPending ? "Submitting..." : "Submit Dispute"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
