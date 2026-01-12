
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { placeBid } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface BidFormProps {
    auctionId: string;
    currentHighestBid: number; // For validation hint
}

export const BidForm = ({ auctionId, currentHighestBid }: BidFormProps) => {
    const [amount, setAmount] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const token = localStorage.getItem("token");

    const mutation = useMutation({
        mutationFn: (bidAmount: number) => placeBid(auctionId, bidAmount),
        onSuccess: () => {
            setAmount("");
            setError(null);
            // Invalidate auction (for status/highest bid) and bids list
            queryClient.invalidateQueries({ queryKey: ["auction", auctionId] });
            queryClient.invalidateQueries({ queryKey: ["bids", auctionId] });
            alert("Bid placed successfully!");
        },
        onError: (err: any) => {
            // Handle Axios error format
            const msg = err.response?.data?.error?.message || err.message || "Failed to place bid";
            setError(msg);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = Number(amount);
        if (!val || isNaN(val)) {
            setError("Please enter a valid amount");
            return;
        }
        if (val <= currentHighestBid) {
            setError(`Bid must be higher than ${currentHighestBid}`);
            return;
        }
        mutation.mutate(val);
    };

    if (!token) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Place a Bid</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full">
                                        <Button className="w-full" disabled variant="secondary">
                                            Log in to Bid
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>You must be logged in to place a bid on this item.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Place a Bid</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder={`Higher than ${currentHighestBid}`}
                            value={amount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                            disabled={mutation.isPending}
                        />
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Placing..." : "Bid"}
                        </Button>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </form>
            </CardContent>
        </Card>
    );
};
