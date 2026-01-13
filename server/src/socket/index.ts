
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { setIO } from "./socketServer";
import { registerProposalSocket } from "./proposal.socket";

export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });

    setIO(io);
    registerProposalSocket(io);

    const auctionNamespace = io.of("/auctions");

    auctionNamespace.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("join_auction", ({ auctionId }) => {
            if (auctionId) {
                socket.join(`auction:${auctionId}`);
                console.log(`Socket ${socket.id} joined auction:${auctionId}`);
            }
        });

        socket.on("leave_auction", ({ auctionId }) => {
            if (auctionId) {
                socket.leave(`auction:${auctionId}`);
                console.log(`Socket ${socket.id} left auction:${auctionId}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};
