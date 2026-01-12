import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

export interface Proposal {
    id: string
    proposedAmount: number | string
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED"
    buyer?: {
        id: string
        displayName?: string
        avatarUrl?: string
        email: string
    }
    seller?: {
        id: string
        displayName?: string
        avatarUrl?: string
        email: string
    }
    createdAt: string
}

interface ProposalCardProps {
    proposal: Proposal
    isSeller?: boolean
    onAccept?: (id: string) => void
    onReject?: (id: string) => void
    onCounter?: (id: string) => void
    isLoading?: boolean
}

export function ProposalCard({
    proposal,
    isSeller = false,
    onAccept,
    onReject,
    onCounter,
    isLoading = false
}: ProposalCardProps) {
    const user = isSeller ? proposal.buyer : proposal.seller
    const amount = Number(proposal.proposedAmount);

    const statusColors = {
        PENDING: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200",
        ACCEPTED: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200",
        REJECTED: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200",
        COUNTERED: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Header: User + Amount */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={user?.avatarUrl} />
                                <AvatarFallback>{user?.displayName?.[0] || user?.email?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user?.displayName || user?.email}</p>
                                <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Status badge */}
                    <div>
                        <Badge className={statusColors[proposal.status]}>
                            {proposal.status}
                        </Badge>
                    </div>

                    {/* Seller actions (only if PENDING) */}
                    {isSeller && proposal.status === "PENDING" && (
                        <div className="flex gap-2 pt-2">
                            <Button
                                size="sm"
                                variant="default"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => onAccept?.(proposal.id)}
                                disabled={isLoading}
                            >
                                Accept
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => onCounter?.(proposal.id)}
                                disabled={isLoading}
                            >
                                Counter
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => onReject?.(proposal.id)}
                                disabled={isLoading}
                            >
                                Reject
                            </Button>
                        </div>
                    )}

                    {/* Buyer actions (if accepted) */}
                    {!isSeller && proposal.status === "ACCEPTED" && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                ✓ Seller accepted! Open chat to finalize details.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
