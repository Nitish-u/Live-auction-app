import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { api, type Message } from "@/lib/api"
import { useWebSocket } from "@/hooks/useWebSocket"

interface ProposalChatBoxProps {
    proposalId: string
}

export function ProposalChatBox({ proposalId }: ProposalChatBoxProps) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)
    const { socket } = useWebSocket()

    // Join room when socket is ready
    useEffect(() => {
        if (socket && proposalId) {
            socket.emit("join-proposal", proposalId);

            return () => {
                socket.emit("leave-proposal", proposalId);
            }
        }
    }, [socket, proposalId]);

    // Fetch initial messages
    const { data: initialMessages, isLoading } = useQuery({
        queryKey: ["proposal-messages", proposalId],
        queryFn: async () => {
            const response = await api.get(`/proposals/${proposalId}/messages`)
            return response.data || []
        }
    })

    // Send message mutation
    const { mutate: sendMessage, isPending } = useMutation({
        mutationFn: async (content: string) => {
            const response = await api.post(`/proposals/${proposalId}/messages`, { content })
            return response.data
        },
        onSuccess: () => {
            //   setMessages(prev => [newMessage, ...prev]) // Socket will handle receiving this?
            // If backend emits to sender too, we don't need this.
            // Usually socket emits to everyone in room including sender if using `io.to()`.
            // Controller uses `io.to(room).emit()`. This broadcasts to everyone in room.
            // So if I am in room, I receive it.
            // However, optimistically updating or relying on socket?
            // If I rely on socket, I might see delay.
            // Let's rely on socket event to avoid double message if API returns + socket event arrives.
            setInput("")
        }
    })

    // WebSocket: Listen for real-time messages
    useEffect(() => {
        if (!socket) return

        const handleMessage = (newMessage: Message) => {
            setMessages(prev => {
                // Avoid duplicates (checking ID)
                if (prev.find(m => m.id === newMessage.id)) return prev;
                return [newMessage, ...prev]
            })
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" })
            }, 100)
        };

        socket.on(`proposal:${proposalId}:message`, handleMessage)

        return () => {
            socket.off(`proposal:${proposalId}:message`, handleMessage)
        }
    }, [socket, proposalId])

    // Set initial messages
    useEffect(() => {
        if (initialMessages) {
            setTimeout(() => {
                setMessages(initialMessages)
                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
                }, 100)
            }, 0)
        }
    }, [initialMessages])

    const handleSend = () => {
        if (!input.trim()) return
        sendMessage(input)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col h-96">
            <CardHeader className="border-b">
                <CardTitle className="text-lg">Chat</CardTitle>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col-reverse space-y-4 space-y-reverse">
                    {messages.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                            No messages yet. Start the conversation!
                        </p>
                    ) : (
                        messages.map((msg, idx) => (
                            <div
                                key={msg.id || idx}
                                className={`flex gap-3 ${msg.sender.id === user?.id ? "justify-end" : "justify-start"
                                    }`}
                            >
                                {msg.sender.id !== user?.id && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={msg.sender?.avatarUrl} />
                                        <AvatarFallback>{msg.sender?.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                )}

                                <div
                                    className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender.id === user?.id
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <span className="text-xs opacity-75 mt-1 block">
                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="border-t p-4 flex gap-2">
                <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    disabled={isPending}
                />
                <Button
                    onClick={handleSend}
                    disabled={isPending || !input.trim()}
                    size="icon"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    )
}
