// src/index.ts
import { createServer } from "node:http";
import { createApp, createRouter, eventHandler, toNodeListener } from "h3";

import { BASE_URL, SERVER_HOST, SERVER_PORT } from "./env";
import { handleAuthorize, handleCallback } from "./oauthHandlers";

import logger from "./logger";

const app = createApp();
const server = createServer(toNodeListener(app));
const router = createRouter()
  .get("/auth/authorize", handleAuthorize)
  .get("/auth/callback", handleCallback);

app.use(router.handler);
app.use(eventHandler((event) => {
  logger.debug(`Request: ${event.node.req.url}`);
}));

server.listen({ host: SERVER_HOST, port: SERVER_PORT }, () => {
  logger.info(`Listening on ${BASE_URL})`);
});

export default server;
