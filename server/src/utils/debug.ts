import logger from "../config/logger";

export const debug = (message: string, meta: Record<string, any> = {}) => {
    if (process.env.NODE_ENV === "development") {
        logger.debug(message, {
            requestId: meta.requestId || undefined,
            ...meta
        });
    }
};
