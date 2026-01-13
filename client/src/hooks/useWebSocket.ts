import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "@/hooks/useAuth"

// Singleton socket instance to prevent multiple connections
let socketInstance: Socket | null = null

export function useWebSocket() {
    const { token } = useAuth()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (!token) {
            if (socketInstance) {
                socketInstance.disconnect()
                socketInstance = null
                setTimeout(() => {
                    setSocket(null)
                    setIsConnected(false)
                }, 0)
            }
            return
        }

        if (!socketInstance) {
            // Check env var or default to current host
            const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"
            // If VITE_API_URL includes /api, strip it or use root
            // Usually socket.io connects to root. 
            // VITE_API_URL might be http://localhost:4000/api/v1

            // Safer to use direct host if needed, or assume backend serves socket on same port
            // But if VITE_API_URL is set, parse it.
            let url = SERVER_URL
            try {
                const urlObj = new URL(SERVER_URL)
                url = urlObj.origin // http://localhost:4000
            } catch {
                // fallback
            }

            socketInstance = io(url, {
                auth: {
                    token: token
                },
                transports: ["websocket", "polling"]
            })

            socketInstance.on("connect", () => {
                console.log("WebSocket connected", socketInstance?.id)
                setIsConnected(true)
            })

            socketInstance.on("disconnect", () => {
                console.log("WebSocket disconnected")
                setIsConnected(false)
            })

            socketInstance.on("connect_error", (err) => {
                console.error("WebSocket connection error:", err)
            })
        }

        if (socketInstance) {
            setTimeout(() => setSocket(socketInstance), 0)
        }

        // Cleanup on unmount? 
        // We might want to keep socket open across pages. Singleton pattern handles this.
        // But if token changes, we should reconnect? 
        // With singleton outside component, it persists. 
        // If token changes, we might need to reconnect. 
        // For now, let's keep it simple.

    }, [token])

    return { socket, isConnected }
}
