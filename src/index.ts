// src/index.ts
import { createServer } from "node:http";
import { createApp, createRouter, toNodeListener } from "h3";

import { BASE_URL, SERVER_HOST, SERVER_PORT } from "./env";
import { handleAuthorize, handleCallback } from "./oauthHandlers";

import logger from "./logger";

const app = createApp();
const server = createServer(toNodeListener(app));
const router = createRouter()
  .get("authorize", handleAuthorize)
  .get("callback", handleCallback);

app.use("/auth", router.handler);

server.listen({ host: SERVER_HOST, port: SERVER_PORT }, () => {
  logger.info(`Listening on ${BASE_URL})`);
});

export default server;
