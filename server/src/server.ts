import http from "http";
import app from "./app";
import { env } from "./config/env";
import { initSocket } from "./socket/index";

import logger from "./config/logger";
import { logEvent } from "./utils/logEvent";

const PORT = env.PORT;

const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io);

server.listen(PORT, () => {
    logEvent("SERVER_STARTUP", { port: PORT, env: env.NODE_ENV });
});
