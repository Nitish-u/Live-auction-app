import http from "http";
import app from "./app";
import { env } from "./config/env";
import { initSocket } from "./socket/index";

const PORT = env.PORT;

const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
