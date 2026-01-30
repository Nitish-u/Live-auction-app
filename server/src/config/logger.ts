import { createLogger, format, transports } from "winston";
import { env } from "./env";
const { printf, timestamp, combine, colorize, errors } = format;

// Custom format for local development
const customConsoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }), // Captures stack traces for error objects
    timestamp({ format: "HH:mm:ss" })
  ),
  transports: [
    // Console Transport with colors
    new transports.Console({
      format: combine(
        colorize(),
        customConsoleFormat
      ),
    }),
    // File Transport (standard winston version)
    new transports.File({
      dirname: "logs",
      // Note: This name is static until process restart
      filename: `app_${new Date().toISOString().split('T')[0]}.log`,
      format: format.json(), // Usually better for logs in files
    }),
  ],
});

export default logger;