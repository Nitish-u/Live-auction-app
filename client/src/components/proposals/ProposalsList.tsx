import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProposalCard } from "@/components/proposals/ProposalCard"
import type { Proposal } from "@/components/proposals/ProposalCard"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ProposalsListProps {
    assetId?: string
    isSeller?: boolean
}

export function ProposalsList({ assetId, isSeller = false }: ProposalsListProps) {
    const queryClient = useQueryClient()
    const endpoint = isSeller ? "/proposals/my-assets" : "/proposals/my-sent"
    const params = assetId && isSeller ? { assetId } : {}

    const { data: proposals, isLoading } = useQuery({
        queryKey: [endpoint, assetId],
        queryFn: async () => {
            const response = await api.get(endpoint, { params })
            return response.data || []
        }
    })

    // Mutations
    const acceptMutation = useMutation({
        mutationFn: async (proposalId: string) => {
            return api.post(`/proposals/${proposalId}/accept`)
        },
        onSuccess: () => {
            toast.success("Proposal accepted")
            queryClient.invalidateQueries({ queryKey: [endpoint] })
            // Also invalidate asset queries if needed
        },
        onError: () => toast.error("Failed to accept proposal")
    })

    const rejectMutation = useMutation({
        mutationFn: async (proposalId: string) => {
            return api.post(`/proposals/${proposalId}/reject`)
        },
        onSuccess: () => {
            toast.success("Proposal rejected")
            queryClient.invalidateQueries({ queryKey: [endpoint] })
        },
        onError: () => toast.error("Failed to reject proposal")
    })

    // Counter Logic
    const [counterProposalId, setCounterProposalId] = useState<string | null>(null)
    const [counterAmount, setCounterAmount] = useState<string>("")
    const [isCountering, setIsCountering] = useState(false)

    const handleCounterClick = (id: string) => {
        setCounterProposalId(id)
        setCounterAmount("")
    }

    const submitCounter = async () => {
        if (!counterProposalId || !counterAmount) return

        setIsCountering(true)
        try {
            await api.post(`/proposals/${counterProposalId}/counter`, {
                proposedAmount: parseFloat(counterAmount)
            })
            toast.success("Counter offer sent!")
            setCounterProposalId(null)
            queryClient.invalidateQueries({ queryKey: [endpoint] })
        } catch {
            toast.error("Failed to send counter offer")
        } finally {
            setIsCountering(false)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        )
    }

    if (!proposals || proposals.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isSeller ? "No proposals received yet" : "No proposals sent yet"}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {proposals.map((proposal: Proposal) => (
                <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isSeller={isSeller}
                    onAccept={() => acceptMutation.mutate(proposal.id)}
                    onReject={() => rejectMutation.mutate(proposal.id)}
                    onCounter={() => handleCounterClick(proposal.id)}
                    isLoading={acceptMutation.isPending || rejectMutation.isPending}
                />
            ))}

            <Dialog open={!!counterProposalId} onOpenChange={(open) => !open && setCounterProposalId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Counter Offer</DialogTitle>
                        <DialogDescription>
                            Propose a new amount to the buyer. They will have to accept it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={counterAmount}
                                onChange={(e) => setCounterAmount(e.target.value)}
                                className="col-span-3"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCounterProposalId(null)}>Cancel</Button>
                        <Button onClick={submitCounter} disabled={isCountering}>
                            {isCountering ? "Sending..." : "Send Counter Offer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
