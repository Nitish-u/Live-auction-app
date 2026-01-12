import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDisputes, resolveDispute } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

export function DisputeManagerTab() {
    const queryClient = useQueryClient();

    const { data: disputes, isLoading } = useQuery({
        queryKey: ["admin-disputes"],
        queryFn: fetchDisputes,
        // Refresh every 30 seconds as per spec
        refetchInterval: 30000,
    });

    const resolveMutation = useMutation({
        mutationFn: ({ id, resolution }: { id: string; resolution: "REFUND" | "RELEASE" }) =>
            resolveDispute(id, resolution),
        onSuccess: (_, variables) => {
            toast.success(`Dispute resolved: ${variables.resolution}`);
            // Invalidate both disputes list and admin dashboard stats
            queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard", "admin"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to resolve dispute");
        },
    });

    const handleResolve = (id: string, resolution: "REFUND" | "RELEASE") => {
        if (window.confirm(`Are you sure you want to ${resolution} this dispute? This action is irreversible.`)) {
            resolveMutation.mutate({ id, resolution });
        }
    };

    if (isLoading) {
        return <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>;
    }

    if (!disputes || disputes.length === 0) {
        return (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
                <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2" />
                <h3 className="text-lg font-medium">No Open Disputes</h3>
                <p className="text-muted-foreground">Great job! There are no disputes requiring resolution right now.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Dispute ID</TableHead>
                        <TableHead>Auction / Asset</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {disputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                            <TableCell className="font-mono text-xs">{dispute.id.slice(0, 8)}...</TableCell>
                            <TableCell>
                                <span className="font-medium block">{dispute.escrow.auction.asset.title}</span>
                                <span className="text-xs text-muted-foreground">{dispute.escrow.auction.title}</span>
                            </TableCell>
                            <TableCell>{dispute.buyer.email}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={dispute.reason}>
                                {dispute.reason}
                            </TableCell>
                            <TableCell className="font-medium">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(dispute.escrow.amount))}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleResolve(dispute.id, "REFUND")}
                                    disabled={resolveMutation.isPending}
                                >
                                    Refund Buyer
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-600 text-green-600 hover:bg-green-50"
                                    onClick={() => handleResolve(dispute.id, "RELEASE")}
                                    disabled={resolveMutation.isPending}
                                >
                                    Release to Seller
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
