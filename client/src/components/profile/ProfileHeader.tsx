import { useState } from "react";
import type { UserPrivateProfile } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Edit } from "lucide-react";
import { EditProfileDialog } from "./EditProfileDialog";

interface ProfileHeaderProps {
    profile: UserPrivateProfile;
    isOwnProfile: boolean;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const initials = (profile.displayName?.[0] || profile.email?.[0] || "U").toUpperCase();

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center p-6 bg-card rounded-xl border shadow-sm">

                {/* Avatar */}
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-md">
                    <AvatarImage src={profile.avatarUrl || ""} alt={profile.displayName || "User"} className="object-cover" />
                    <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
                </Avatar>

                {/* Info & Actions */}
                <div className="flex-1 space-y-4 w-full">

                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{profile.displayName || "Anonymous User"}</h1>
                            <p className="text-muted-foreground">{profile.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {profile.createdAt ? `Member since ${new Date(profile.createdAt).toLocaleDateString()}` : "Member"}
                            </p>
                        </div>

                        {/* Actions */}
                        {isOwnProfile && (
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Bio */}
                    <div className="text-sm md:text-base leading-relaxed max-w-3xl">
                        {profile.bio ? (
                            <p>{profile.bio}</p>
                        ) : (
                            <p className="text-muted-foreground italic">No bio provided yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {isOwnProfile && (
                <EditProfileDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    profile={profile}
                />
            )}
        </div>
    );
}
