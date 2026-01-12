
import { AlertCircle, Clock, CheckCircle, Lock } from "lucide-react"

interface AssetStatusBadgeProps {
    status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
    rejectionReason?: string | null
}

export function AssetStatusBadge({ status, rejectionReason }: AssetStatusBadgeProps) {
    const statusConfig = {
        DRAFT: {
            label: "Draft",
            icon: Lock,
            variant: "secondary" as const, // gray/outline
            bgColor: "bg-gray-100 dark:bg-gray-800",
            textColor: "text-gray-700 dark:text-gray-300"
        },
        PENDING_REVIEW: {
            label: "Pending Review",
            icon: Clock,
            variant: "outline" as const,
            bgColor: "bg-blue-100 dark:bg-blue-900",
            textColor: "text-blue-700 dark:text-blue-300"
        },
        APPROVED: {
            label: "Approved",
            icon: CheckCircle,
            variant: "default" as const, // green
            bgColor: "bg-green-100 dark:bg-green-900",
            textColor: "text-green-700 dark:text-green-300"
        },
        REJECTED: {
            label: "Rejected",
            icon: AlertCircle,
            variant: "destructive" as const, // red
            bgColor: "bg-red-100 dark:bg-red-900",
            textColor: "text-red-700 dark:text-red-300"
        }
    }

    const config = statusConfig[status] || statusConfig.DRAFT // Fallback to DRAFT if status is unknown
    const Icon = config.icon

    return (
        <div className="flex flex-col gap-1 items-end">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${config.bgColor} shadow-sm backdrop-blur-md bg-opacity-90`}>
                <Icon className={`w-3 h-3 ${config.textColor}`} />
                <span className={`text-xs font-medium ${config.textColor}`}>
                    {config.label}
                </span>
            </div>

            {status === "REJECTED" && rejectionReason && (
                <div className="bg-red-50 dark:bg-red-950/50 p-1.5 rounded text-[10px] max-w-[150px] text-right">
                    <p className="text-red-600 dark:text-red-400 font-medium truncate">
                        {rejectionReason}
                    </p>
                </div>
            )}
        </div>
    )
}
