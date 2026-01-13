import { Server, Socket } from "socket.io"

export function registerProposalSocket(io: Server) {
    io.on("connection", (socket: Socket) => {
        // Join proposal room
        socket.on("join-proposal", (proposalId: string) => {
            socket.join(`proposal:${proposalId}`)
        })

        // Message sent via API, broadcast to room
        socket.on("proposal:message", (proposalId: string, message: any) => {
            io.to(`proposal:${proposalId}`).emit(`proposal:${proposalId}:message`, message)
        })

        // Leave proposal room
        socket.on("leave-proposal", (proposalId: string) => {
            socket.leave(`proposal:${proposalId}`)
        })
    })
}
