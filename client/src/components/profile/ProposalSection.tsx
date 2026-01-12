import { useQuery } from "@tanstack/react-query";
import { fetchIncomingProposals } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function ProposalSection() {
    const { data, isLoading } = useQuery({
        queryKey: ["incomingProposals"],
        queryFn: fetchIncomingProposals,
    });

    if (isLoading) {
        return <Skeleton className="w-full h-[200px]" />;
    }

    const proposals = data?.proposals || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Incoming Proposals</CardTitle>
                <CardDescription>Offers received on your assets.</CardDescription>
            </CardHeader>
            <CardContent>
                {proposals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No proposals yet. Share your assets to start receiving offers.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {proposals.map((proposal) => (
                            <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={proposal.buyerAvatar} alt={proposal.buyerName} />
                                        <AvatarFallback>{proposal.buyerName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{proposal.buyerName} offered ${proposal.proposedAmount}</p>
                                        <p className="text-xs text-muted-foreground">for {proposal.assetTitle}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="capitalize">{proposal.status.toLowerCase()}</Badge>
                                    <span className="text-xs text-muted-foreground">{new Date(proposal.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
