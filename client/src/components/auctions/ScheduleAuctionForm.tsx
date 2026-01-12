import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { addMinutes, addHours } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"

// Validation schema
const scheduleAuctionSchema = z.object({
    assetId: z.string().min(1, "Please select an asset"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required")
}).refine(
    (data) => {
        if (!data.startTime || !data.endTime) return true
        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        return end > start
    },
    {
        message: "End time must be after start time",
        path: ["endTime"]
    }
).refine(
    (data) => {
        if (!data.startTime) return true
        const start = new Date(data.startTime)
        const now = new Date()
        const minStart = addMinutes(now, 5)
        return start >= minStart
    },
    {
        message: "Start time must be at least 5 minutes from now",
        path: ["startTime"]
    }
).refine(
    (data) => {
        if (!data.startTime || !data.endTime) return true
        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        const maxEnd = addHours(start, 24)
        return end <= maxEnd
    },
    {
        message: "Auction duration cannot exceed 24 hours",
        path: ["endTime"]
    }
)

type ScheduleAuctionFormValues = z.infer<typeof scheduleAuctionSchema>

interface ApprovedAsset {
    id: string
    title: string
    images: string[]
    status: string
}

export function ScheduleAuctionForm() {
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)

    // Fetch user's approved assets
    const { data: assets, isLoading, error } = useQuery({
        queryKey: ["my-approved-assets"],
        queryFn: async () => {
            const response = await api.get("/assets/my")
            // Filter for approved assets only
            // Backend returns { assets: [...] }
            return response.data.assets.filter((asset: any) => asset.status === "APPROVED")
        }
    })

    const form = useForm<ScheduleAuctionFormValues>({
        resolver: zodResolver(scheduleAuctionSchema),
        defaultValues: {
            assetId: "",
            startTime: "",
            endTime: ""
        }
    })

    // When asset is selected, auto-fill default times
    const selectedAssetId = form.watch("assetId")
    useEffect(() => {
        if (selectedAssetId) {
            const now = new Date()
            const startTime = addHours(now, 1) // 1 hour from now
            const endTime = addHours(startTime, 1) // 1 hour duration

            form.setValue("startTime", formatDateTimeLocal(startTime))
            form.setValue("endTime", formatDateTimeLocal(endTime))
        }
    }, [selectedAssetId, form])

    const onSubmit = async (data: ScheduleAuctionFormValues) => {
        setSubmitting(true)

        try {
            await api.post("/auctions", {
                assetId: data.assetId,
                startTime: new Date(data.startTime).toISOString(),
                endTime: new Date(data.endTime).toISOString()
            })

            toast.success("Auction scheduled successfully!")
            navigate("/dashboard", { state: { tab: "seller" } })
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Failed to schedule auction"
            toast.error(message)
        } finally {
            setSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto space-y-4" data-testid="loading-skeleton">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-red-800 dark:text-red-200">
                        Failed to load your assets. Please try again.
                    </p>
                </div>
            </div>
        )
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded border-2 border-dashed">
                    <h2 className="text-lg font-semibold mb-2">No Approved Assets</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You don't have any approved assets yet. Create and submit an asset for admin review first.
                    </p>
                    <Button onClick={() => navigate("/create-asset")}>
                        Create Asset
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Schedule Auction</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Select an approved asset and set the auction time window
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Asset Selection */}
                    <FormField
                        control={form.control}
                        name="assetId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select Asset *</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose an asset to auction" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {assets.map((asset: ApprovedAsset) => (
                                            <SelectItem key={asset.id} value={asset.id}>
                                                {asset.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Only your approved assets are shown
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Start Time */}
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Auction Start Time *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="datetime-local"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Auction must start at least 5 minutes from now
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* End Time */}
                    <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Auction End Time *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="datetime-local"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Auction must end after start time. Maximum duration is 24 hours.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Duration Display */}
                    {form.watch("startTime") && form.watch("endTime") && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                📅 Duration:{" "}
                                {calculateDuration(
                                    new Date(form.watch("startTime")),
                                    new Date(form.watch("endTime"))
                                )}
                            </p>
                        </div>
                    )}

                    {/* Submit button */}
                    <div className="flex gap-4">
                        <Button
                            type="submit"
                            disabled={submitting || !selectedAssetId}
                            className="flex-1"
                        >
                            {submitting ? "Scheduling..." : "Schedule Auction"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}

// Helper function to format date for datetime-local input
function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Helper function to calculate duration
function calculateDuration(start: Date, end: Date): string {
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid dates";
    const diff = end.getTime() - start.getTime()
    if (diff < 0) return "Invalid duration";

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours === 0) {
        return `${minutes} minutes`
    }
    return `${hours}h ${minutes}m`
}
