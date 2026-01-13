import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMyProfile, api, getFriendlyErrorMessage } from "@/lib/api";
import type { UserPrivateProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: UserPrivateProfile;
}

export function EditProfileDialog({ open, onOpenChange, profile }: EditProfileDialogProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: "",
        bio: "",
        avatarUrl: "",
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                displayName: profile.displayName || "",
                bio: profile.bio || "",
                avatarUrl: profile.avatarUrl || "",
            });
        }
    }, [profile, open]);

    const mutation = useMutation({
        mutationFn: updateMyProfile,
        onSuccess: (updatedProfile) => {
            queryClient.setQueryData(["myProfile"], updatedProfile);
            toast.success("Profile updated successfully");
            onOpenChange(false);
        },
        onError: (err: unknown) => {
            console.error(err);
            toast.error(getFriendlyErrorMessage(err));
        },
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error("File size must be less than 5MB");
            return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("avatar", file);

        setUploading(true);
        try {
            const { data } = await api.post<{ url: string }>("/upload/avatar", uploadFormData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setFormData(prev => ({ ...prev, avatarUrl: data.url }));
            toast.success("Avatar uploaded!");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload avatar");
        } finally {
            setUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your public profile here.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Avatar Preview & Upload */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
                            <Avatar className="h-24 w-24 border-2 border-border group-hover:opacity-80 transition-opacity">
                                <AvatarImage src={formData.avatarUrl || ""} className="object-cover" />
                                <AvatarFallback className="text-xl">
                                    {formData.displayName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "ME"}
                                </AvatarFallback>
                            </Avatar>

                            {/* Overlay for upload hint */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white" />
                            </div>

                            {/* Loading State */}
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? "Uploading..." : "Change Avatar"}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="displayName" className="text-sm font-medium">
                            Display Name
                        </label>
                        <Input
                            id="displayName"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            minLength={2}
                            maxLength={50}
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="avatarUrl" className="text-sm font-medium">
                            Avatar URL (or upload above)
                        </label>
                        <Input
                            id="avatarUrl"
                            value={formData.avatarUrl}
                            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                            placeholder="https://..."
                            type="url"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="bio" className="text-sm font-medium">
                            Bio
                        </label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            maxLength={500}
                            className="h-24"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending || uploading}>
                            {mutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
