
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { setIO } from "./socketServer";
import { registerProposalSocket } from "./proposal.socket";
import logger from "../config/logger";
import { logEvent } from "../utils/logEvent";

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
        logEvent("INTEGRATION_SOCKET_CONNECTED", { namespace: "/auctions", socketId: socket.id });

        socket.on("join_auction", ({ auctionId }) => {
            if (auctionId) {
                socket.join(`auction:${auctionId}`);
                logEvent("SOCKET_JOINED_ROOM", { socketId: socket.id, room: `auction:${auctionId}` });
            }
        });

        socket.on("leave_auction", ({ auctionId }) => {
            if (auctionId) {
                socket.leave(`auction:${auctionId}`);
                logEvent("SOCKET_LEFT_ROOM", { socketId: socket.id, room: `auction:${auctionId}` });
            }
        });

        socket.on("disconnect", () => {
            logEvent("INTEGRATION_SOCKET_DISCONNECTED", { namespace: "/auctions", socketId: socket.id });
        });
    });

    return io;
};
