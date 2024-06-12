// src/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: "info",

  transports: [
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),

    new winston.transports.File({
      level: "debug",
      filename: "logs/debug.log",
      format: winston.format.json(),
    }),

    new winston.transports.File({
      level: "error",
      filename: "logs/errors.log",
      format: winston.format.json(),
    }),
  ],
});

export default logger;
