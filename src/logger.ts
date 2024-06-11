// src/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.prettyPrint(),
      level: "debug",
    }),
    new winston.transports.File({
      filename: "logs/debug.log",
      format: winston.format.json(),
      level: "debug",
    }),
    new winston.transports.File({
      filename: "logs/errors.log",
      format: winston.format.json(),
      level: "error",
    }),
  ],
});

export default logger;
