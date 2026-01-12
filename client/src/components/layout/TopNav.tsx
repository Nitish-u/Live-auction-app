import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { HamburgerButton } from "./HamburgerButton";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNav() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4 md:px-6">

                {/* Left: Brand + Nav Links */}
                <div className="flex items-center gap-12">
                    <Link to="/" className="flex items-center space-x-2 font-bold text-xl">
                        <span>LiveAuction</span>
                    </Link>

                    {/* Desktop nav links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                cn(
                                    "transition-colors hover:text-foreground/80",
                                    isActive ? "text-foreground" : "text-foreground/60"
                                )
                            }
                            end
                        >
                            Explore Auctions
                        </NavLink>
                        <NavLink
                            to="/explore/assets"
                            className={({ isActive }) =>
                                cn(
                                    "transition-colors hover:text-foreground/80",
                                    isActive ? "text-foreground" : "text-foreground/60"
                                )
                            }
                        >
                            Explore Assets
                        </NavLink>
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-1 items-center justify-end gap-4">
                    <div className="hidden md:flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/schedule-auction">
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Auction
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link to="/create-asset">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Asset
                            </Link>
                        </Button>
                    </div>
                    <NotificationBell />
                    <div className="hidden md:block">
                        <UserMenu />
                    </div>

                    {/* Mobile Hamburger */}
                    <HamburgerButton
                        isOpen={isMobileMenuOpen}
                        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <MobileNav open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </header>
    );
}
