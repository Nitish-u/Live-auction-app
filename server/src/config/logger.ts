import { createLogger, format, transports } from "winston";
import { env } from "./env";
const { printf, timestamp, combine, colorize, errors, json } = format;

// Custom format for local development
const customConsoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${stack || message} ${metaStr}`;
});

const logContext = format((info) => {
  if (!info.service) {
    info.service = 'live-auction-api';
  }
  return info;
});

const logger = createLogger({
  level: env.NODE_ENV === "development"
    ? "debug"
    : env.NODE_ENV === "test"
      ? "info"
      : "warn",
  format: combine(
    logContext(),
    errors({ stack: true }), // Captures stack traces for error objects
    timestamp({ format: "ISO" }), // ISO format is better for standards
    json() // Default to JSON for structural integrity
  ),
  defaultMeta: { service: 'live-auction-api' },
  transports: [
    // Console Transport
    new transports.Console({
      format: env.NODE_ENV === "production"
        ? json() // JSON in production
        : combine(
          colorize(),
          timestamp({ format: "HH:mm:ss" }),
          customConsoleFormat // Readable in dev
        ),
    }),
    // File Transport (standard winston version)
    new transports.File({
      dirname: "logs",
      filename: `app_${new Date().toISOString().split('T')[0]}.log`,
      format: json(),
    }),
  ],
});

export default logger;