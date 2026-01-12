import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminStatsOverview } from "@/components/admin/AdminStatsOverview"
import { AssetReviewTab } from "@/components/admin/AssetReviewTab"
import { DisputeManagerTab } from "@/components/admin/DisputeManagerTab"

export function AdminDashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()

    // Role-based access control
    useEffect(() => {
        if (!user || user.role !== "ADMIN") {
            navigate("/")
        }
    }, [user, navigate])

    // Don't render if not admin
    if (!user || user.role !== "ADMIN") {
        return null
    }

    return (
        <div className="container mx-auto py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Platform overview and management
                </p>
            </div>

            {/* Stats Overview */}
            <AdminStatsOverview />

            {/* Tabs */}
            <Tabs defaultValue="assets" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assets">Asset Reviews</TabsTrigger>
                    <TabsTrigger value="disputes">Disputes</TabsTrigger>
                </TabsList>

                {/* Asset Review Tab */}
                <TabsContent value="assets" className="mt-6">
                    <AssetReviewTab />
                </TabsContent>

                {/* Disputes Tab */}
                <TabsContent value="disputes" className="mt-6">
                    <DisputeManagerTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
