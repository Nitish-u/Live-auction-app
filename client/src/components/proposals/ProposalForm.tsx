import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { api, getFriendlyErrorMessage } from "@/lib/api"

const proposalSchema = z.object({
    proposedAmount: z.number().min(1, "Amount must be greater than 0")
})

type ProposalFormValues = z.infer<typeof proposalSchema>

interface ProposalFormProps {
    assetId: string
    sellerId: string
    onSuccess?: () => void
}

export function ProposalForm({ assetId, sellerId, onSuccess }: ProposalFormProps) {
    const { user } = useAuth()
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<ProposalFormValues>({
        resolver: zodResolver(proposalSchema),
        defaultValues: { proposedAmount: 0 }
    })

    // Don't show form if user is the seller
    if (user?.id === sellerId) {
        return null
    }

    const onSubmit = async (data: ProposalFormValues) => {
        setSubmitting(true)

        try {
            await api.post("/proposals", {
                assetId,
                proposedAmount: data.proposedAmount
            })

            toast.success("Proposal sent! Seller will review it.")
            form.reset()
            onSuccess?.()
        } catch (error: unknown) {
            toast.error(getFriendlyErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="proposedAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Propose an Amount</FormLabel>
                            <FormControl>
                                <div className="flex gap-2 items-center">
                                    <span className="text-lg font-semibold">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="500.00"
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                        value={field.value || ""}
                                    />
                                </div>
                            </FormControl>
                            <p className="text-xs text-gray-500">
                                Seller will review and accept, reject, or counter-offer.
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Sending..." : "Send Proposal"}
                </Button>
            </form>
        </Form>
    )
}
