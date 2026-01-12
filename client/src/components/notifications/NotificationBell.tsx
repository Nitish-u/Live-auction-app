import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["notifications"],
        enabled: isAuthenticated,
        queryFn: () => notifications.list({ limit: 20 }),
        // Refetch periodically to keep updated without websockets
        refetchInterval: 30000
    });

    const markReadMutation = useMutation({
        mutationFn: notifications.markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const unreadCount = data?.unreadCount || 0;
    const notificationItems = data?.items || [];

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        markReadMutation.mutate(id);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : notificationItems.length === 0 ? (
                        <div className="py-12">
                            <EmptyState
                                icon={Bell}
                                title="No notifications"
                                description="You're all caught up!"
                                className="border-0 bg-transparent p-0"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notificationItems.map((item: any) => (
                                <DropdownMenuItem
                                    key={item.id}
                                    className="flex flex-col items-start p-4 cursor-default focus:bg-accent/50 group"
                                    onSelect={(e) => e.preventDefault()} // Keep open? Or navigate?
                                    // Clicking the item marks as read if unread?
                                    onClick={() => !item.read && markReadMutation.mutate(item.id)}
                                >
                                    <div className="flex w-full justify-between items-start gap-2">
                                        <div className={cn("text-sm transition-colors", !item.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                            {item.message}
                                        </div>
                                        {!item.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleMarkRead(item.id, e)}
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                    {/* Optional: Add Link based on metadata */}
                                    {item.metadata?.auctionId && (
                                        <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs" asChild>
                                            <Link to={`/auctions/${item.metadata.auctionId}`}>View Auction</Link>
                                        </Button>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
