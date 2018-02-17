import * as winston from "winston";

export const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: "debug",
            handleExceptions: false,
            json: false,
            colorize: true,
        }),
    ],
    exitOnError: false,
});