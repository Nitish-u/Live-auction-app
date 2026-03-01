import logger from "../config/logger";

export const logEvent = (event: string, meta: Record<string, any> = {}) => {
    logger.info(event, { event, ...meta });
};
