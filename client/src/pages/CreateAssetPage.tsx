import { useAuth } from "@/hooks/useAuth"
import { CreateAssetForm } from "@/components/assets/CreateAssetForm"

export function CreateAssetPage() {
    const { user } = useAuth()

    // Ensure user is authenticated
    if (!user) {
        return (
            <div className="text-center py-12">
                <p>Please log in to create an asset.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <CreateAssetForm />
        </div>
    )
}
