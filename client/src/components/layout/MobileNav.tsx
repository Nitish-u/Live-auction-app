import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MobileNavProps {
    open: boolean;
    onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        onClose();
        navigate("/login");
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform md:hidden",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <nav className="flex flex-col gap-2 p-4">
                    <MobileNavLink to="/" label="Explore Auctions" onClick={onClose} />
                    <MobileNavLink to="/explore/assets" label="Explore Assets" onClick={onClose} />
                    <MobileNavLink to="/dashboard" label="Dashboard" onClick={onClose} />
                    <MobileNavLink to="/profile" label="My Profile" onClick={onClose} />
                    <MobileNavLink to="/settings" label="Settings" onClick={onClose} />

                    {user?.role === "ADMIN" && (
                        <MobileNavLink to="/admin" label="Admin Dashboard" onClick={onClose} />
                    )}

                    <Separator className="my-2" />

                    <Button variant="ghost" className="justify-start text-red-600 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20" onClick={handleLogout}>
                        Logout
                    </Button>
                </nav>
            </div>
        </>
    );
}

interface MobileNavLinkProps {
    to: string;
    label: string;
    onClick: () => void;
}

function MobileNavLink({ to, label, onClick }: MobileNavLinkProps) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "text-foreground/70"
                )
            }
        >
            {label}
        </NavLink>
    );
}
