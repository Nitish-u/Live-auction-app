import { useQuery } from "@tanstack/react-query";
import { fetchMyProfile } from "@/lib/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AssetSection } from "@/components/profile/AssetSection";
import { ProposalSection } from "@/components/profile/ProposalSection";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyProfile() {
    const { data: profile, isLoading, error } = useQuery({
        queryKey: ["myProfile"],
        queryFn: fetchMyProfile,
    });

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
                    <Skeleton className="h-[400px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="container mx-auto p-4 text-center text-red-500">
                Failed to load profile. Please try refreshing.
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-7xl animate-in fade-in duration-500">

            {/* Header Section */}
            <ProfileHeader profile={profile} isOwnProfile={true} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Assets (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <AssetSection userId={profile.id} isOwnProfile={true} />
                </div>

                {/* Right Column: Proposals (1/3 width) */}
                <div className="space-y-6">
                    <ProposalSection />
                </div>
            </div>
        </div>
    );
}
