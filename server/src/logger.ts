// server/src/logger.ts

type LogLevel = "info" | "warn" | "error" | "debug";

const log = (level: LogLevel, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.log(
        JSON.stringify({
            timestamp,
            severity: level.toUpperCase(),
            message,
            ...meta,
        })
    );
};

export const logger = {
    info: (message: string, meta?: any) => log("info", message, meta),
    warn: (message: string, meta?: any) => log("warn", message, meta),
    error: (message: string, meta?: any) => log("error", message, meta),
    debug: (message: string, meta?: any) => log("debug", message, meta),
};
