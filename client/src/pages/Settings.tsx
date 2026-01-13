import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { changePassword, getFriendlyErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { User, Shield, Palette, LogOut, Loader2 } from "lucide-react";

export default function Settings() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Logout Logic
    const handleLogout = () => {
        localStorage.removeItem("token");
        queryClient.clear();
        navigate("/");
        window.location.reload();
    };

    // Password Change Logic
    const { mutate: doChangePassword, isPending } = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
        },
        onError: (error: unknown) => {
            toast.error(getFriendlyErrorMessage(error));
        },
    });

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast.error("New password must be at least 8 characters");
            return;
        }
        doChangePassword({ currentPassword, newPassword });
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="appearance">
                        <Palette className="w-4 h-4 mr-2" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="w-4 h-4 mr-2" />
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* PROFILE SECTION */}
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Public Profile</CardTitle>
                            <CardDescription>
                                Manage how you appear to other users on the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Your public profile includes your display name, avatar, and bio.
                            </p>
                            <Button asChild>
                                <Link to="/profile">Edit Profile</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* APPEARANCE SECTION */}
                <TabsContent value="appearance" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize the look and feel of the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Theme
                                </label>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Select your preferred theme for the application.
                                </p>
                                <ThemeSwitcher />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SECURITY SECTION */}
                <TabsContent value="security" className="mt-6">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                    Update your password to keep your account secure.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium" htmlFor="current-password">Current Password</label>
                                        <Input
                                            id="current-password"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium" htmlFor="new-password">New Password</label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                        <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>
                                    </div>
                                    <Button type="submit" disabled={isPending}>
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Password
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-red-200 dark:border-red-900">
                            <CardHeader>
                                <CardTitle className="text-red-600">Session Management</CardTitle>
                                <CardDescription>
                                    Log out of your current session.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button variant="destructive" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}
