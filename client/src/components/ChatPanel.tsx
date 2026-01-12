import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchMessages, sendMessage } from "../lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { EmptyState } from "./common/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Assuming sonner is used based on AuctionDetails

interface ChatPanelProps {
    auctionId: string;
    isParticipant: boolean;
}

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
};

export const ChatPanel = ({ auctionId, isParticipant }: ChatPanelProps) => {
    const [content, setContent] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);

    const currentUser = getCurrentUser();

    // Fetch Messages
    const { data: messages, isLoading } = useQuery({
        queryKey: ["messages", auctionId],
        queryFn: () => fetchMessages(auctionId),
        refetchOnWindowFocus: false,
    });

    // Send Message Mutation
    const mutation = useMutation({
        mutationFn: (text: string) => sendMessage(auctionId, text),
        onSuccess: () => {
            setContent("");
            setShouldAutoScroll(true); // Always scroll to bottom on own message
        },
        onError: (err: any) => {
            console.error("Failed to send message", err);
            toast.error("Failed to send message");
        }
    });

    // Scroll Logic
    useEffect(() => {
        if (messages && messages.length > 0) {
            if (shouldAutoScroll) {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
                setHasNewMessages(false);
            } else {
                // If not auto-scrolling, it means we are viewing history and a new message arrived
                setHasNewMessages(true);
            }
        }
    }, [messages, shouldAutoScroll]);

    // Detect if user scrolled up
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        setShouldAutoScroll(isNearBottom);
        if (isNearBottom) setHasNewMessages(false);
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        mutation.mutate(content);
    };

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        setHasNewMessages(false);
        setShouldAutoScroll(true);
    };

    if (isLoading) {
        return (
            <Card className="h-[500px] flex flex-col">
                <CardHeader className="py-3 px-4 border-b">
                    <CardTitle className="text-sm font-medium">Live Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground animate-pulse">Loading chat...</p>
                </CardContent>
            </Card>
        );
    }

    // Group Messages
    const groupedMessages = messages?.reduce((acc: any[], msg: any, index: number) => {
        const prevMsg = messages[index - 1];
        const isSameSender = prevMsg && prevMsg.sender.email === msg.sender.email;
        const isTimeClose = prevMsg && (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 60000); // 1 min

        if (isSameSender && isTimeClose) {
            acc[acc.length - 1].group.push(msg);
        } else {
            acc.push({ ...msg, group: [msg] });
        }
        return acc;
    }, []) || [];

    return (
        <Card className="h-[500px] flex flex-col relative">
            <CardHeader className="py-3 px-4 border-b flex flex-row justify-between items-center bg-card z-10">
                <CardTitle className="text-sm font-medium">Live Chat</CardTitle>
                <div className="flex items-center gap-2">
                    {/* Online count could go here */}
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea
                    className="h-full p-4"
                    onScrollCapture={handleScroll} // Capture scroll events on the underlying viewport
                >
                    <div className="space-y-4 pb-2">
                        {messages?.length === 0 && (
                            <div className="h-full flex items-center justify-center">
                                <EmptyState
                                    title="No messages yet"
                                    description="Be the first to say hello!"
                                    className="border-0 bg-transparent"
                                />
                            </div>
                        )}

                        {groupedMessages.map((group, i) => {
                            const isMe = group.sender.email === currentUser?.email;
                            return (
                                <div key={i} className={cn(
                                    "flex w-full gap-2",
                                    isMe ? "justify-end" : "justify-start"
                                )}>
                                    {!isMe && (
                                        <Avatar className="h-8 w-8 mt-1">
                                            <AvatarImage src={group.sender.avatarUrl} />
                                            <AvatarFallback>{group.sender.email[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div className={cn("flex flex-col max-w-[80%]", isMe ? "items-end" : "items-start")}>
                                        {!isMe && (
                                            <span className="text-[10px] text-muted-foreground ml-1 mb-1">
                                                {group.sender.displayName || group.sender.email.split("@")[0]}
                                            </span>
                                        )}

                                        <div className="space-y-1">
                                            {group.group.map((msg: any, idx: number) => (
                                                <div
                                                    key={msg.id}
                                                    className={cn(
                                                        "p-2 px-3 text-sm rounded-2xl break-words relative group hover:shadow-sm transition-shadow duration-200",
                                                        isMe
                                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                                            : "bg-muted text-foreground rounded-bl-none",
                                                        idx > 0 && isMe && "rounded-tr-md", // Stack effect
                                                        idx > 0 && !isMe && "rounded-tl-md"
                                                    )}
                                                    title={new Date(msg.createdAt).toLocaleString()}
                                                >
                                                    {msg.content}
                                                </div>
                                            ))}
                                        </div>

                                        <span className="text-[10px] text-muted-foreground opacity-50 mt-1 px-1">
                                            {formatRelativeTime(group.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* New Message Indicator */}
                {hasNewMessages && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={scrollToBottom}
                            className="shadow-lg border animate-in fade-in slide-in-from-bottom-2"
                        >
                            New messages ↓
                        </Button>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-3 border-t bg-card z-10">
                {isParticipant ? (
                    <form onSubmit={handleSend} className="flex w-full gap-2">
                        <Input
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Type a message..."
                            disabled={mutation.isPending}
                            className="flex-1"
                        />
                        <Button type="submit" size="sm" disabled={mutation.isPending || !content.trim()}>
                            Send
                        </Button>
                    </form>
                ) : (
                    <div className="w-full p-2 bg-muted/50 rounded-md text-center text-xs text-muted-foreground">
                        You must be a participant to chat in this auction.
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};
