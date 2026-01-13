import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, FileUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { api, getFriendlyErrorMessage } from "@/lib/api"

interface FinalizationWindowProps {
    proposalId: string
    onFinalized?: () => void
}

export function FinalizationWindow({ proposalId, onFinalized }: FinalizationWindowProps) {
    const { user } = useAuth()
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])

    // Fetch finalization status
    const { data: finalization, isLoading, refetch } = useQuery({
        queryKey: ["proposal-finalization", proposalId],
        queryFn: async () => {
            const response = await api.get(`/proposals/${proposalId}/finalize`)
            return response.data
        }
    })

    // Upload docs mutation
    const { mutate: uploadDocs, isPending: isUploading } = useMutation({
        mutationFn: async (files: File[]) => {
            const formData = new FormData()
            files.forEach(f => formData.append("files", f))
            // Requires proper content-type header for multipart? Axios sets it automatically if body is FormData
            const response = await api.post(`/proposals/${proposalId}/finalize/docs`, formData)
            return response.data
        },
        onSuccess: () => {
            toast.success("Documents uploaded successfully")
            setSelectedFiles([])
            refetch()
        },
        onError: (error: unknown) => {
            toast.error(getFriendlyErrorMessage(error))
        }
    })

    // Confirm finalization mutation
    const { mutate: confirmFinalization, isPending: isConfirming } = useMutation({
        mutationFn: async () => {
            const response = await api.post(`/proposals/${proposalId}/finalize/confirm`)
            return response.data
        },
        onSuccess: (data) => {
            toast.success("Finalization confirmed!")
            refetch()
            if (data.status === "BOTH_CONFIRMED") {
                onFinalized?.()
            }
        }
    })

    if (isLoading) {
        return <Skeleton className="h-64 w-full" />
    }

    if (!finalization) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Finalization not available yet</p>
                </CardContent>
            </Card>
        )
    }

    const isCurrentUserBuyer = user?.id === finalization.proposal?.buyerId
    const userConfirmed = isCurrentUserBuyer
        ? finalization.buyerConfirmed
        : finalization.sellerConfirmed
    const otherUserConfirmed = isCurrentUserBuyer
        ? finalization.sellerConfirmed
        : finalization.buyerConfirmed
    const userDocs = isCurrentUserBuyer
        ? finalization.buyerDocsUrl
        : finalization.sellerDocsUrl

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <span>Finalization Window</span>
                    <Badge variant={finalization.status === "COMPLETED" ? "default" : "outline"}>
                        {finalization.status}
                    </Badge>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <div>
                        <p className="text-xs text-gray-500">Proposed Amount</p>
                        <p className="text-xl font-bold">${Number(finalization.proposal?.proposedAmount).toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Platform Charge (2.5%)</p>
                        <p className="text-xl font-bold">${Number(finalization.platformCharge).toFixed(2)}</p>
                    </div>
                </div>

                {/* Document Upload */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Upload Supporting Documents</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Upload certificates, proof of authenticity, or relevant documents (PDF, JPG, PNG)
                    </p>

                    <input
                        type="file"
                        multiple
                        onChange={e => setSelectedFiles(Array.from(e.currentTarget.files || []))}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm py-2"
                    />

                    {selectedFiles.length > 0 && (
                        <div className="space-y-1">
                            {selectedFiles.map((f, i) => (
                                <p key={i} className="text-xs text-blue-600">
                                    ✓ {f.name}
                                </p>
                            ))}
                        </div>
                    )}

                    <Button
                        onClick={() => uploadDocs(selectedFiles)}
                        disabled={selectedFiles.length === 0 || isUploading}
                        size="sm"
                        variant="outline"
                        className="w-full"
                    >
                        <FileUp className="w-4 h-4 mr-2" />
                        {isUploading ? "Uploading..." : "Upload Documents"}
                    </Button>
                </div>

                {/* Uploaded Docs */}
                {userDocs && userDocs.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                            Your Documents ({userDocs.length})
                        </p>
                        <div className="space-y-1">
                            {userDocs.map((doc: string, i: number) => (
                                <a
                                    key={i}
                                    href={doc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                >
                                    Document {i + 1}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Confirmation Status */}
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="font-semibold text-sm">Confirmation Status</p>

                    <div className="space-y-2">
                        {/* Current User */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm">You</span>
                            {userConfirmed ? (
                                <Badge className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Confirmed
                                </Badge>
                            ) : (
                                <Badge variant="outline">Pending</Badge>
                            )}
                        </div>

                        {/* Other User */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm">
                                {isCurrentUserBuyer ? "Seller" : "Buyer"}
                            </span>
                            {otherUserConfirmed ? (
                                <Badge className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Confirmed
                                </Badge>
                            ) : (
                                <Badge variant="outline">Waiting</Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Confirm Button */}
                {!userConfirmed && finalization.status === "PENDING" && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <div className="flex gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                By confirming, you agree to finalize this trade on the proposed amount.
                            </p>
                        </div>
                        <Button
                            onClick={() => confirmFinalization()}
                            disabled={isConfirming || (userDocs?.length || 0) === 0}
                            className="w-full"
                        >
                            {isConfirming ? "Confirming..." : "Confirm Finalization"}
                        </Button>
                    </div>
                )}

                {/* Both Confirmed */}
                {finalization.status === "BOTH_CONFIRMED" && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                            ✓ Trade finalized! Settlement is in progress.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
