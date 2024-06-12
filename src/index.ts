// src/index.ts
import { createServer } from "node:http";
import { createApp, eventHandler, toNodeListener } from "h3";

import c from "./config";
import l from "./logger";
import r from "./router";

const a = createApp()
  .use(r)
  .use(
    "*",
    eventHandler((event) => {
      l.debug(`Request: ${event.node.req.url}`);
    }),
  );

const listener = toNodeListener(a);
const server = createServer(listener);

server.listen({
  host: c.SERVER_HOST,
  port: c.SERVER_PORT,
}, () => {
  l.info(`Listening on ${c.BASE_URL}`);
});

export default a;
