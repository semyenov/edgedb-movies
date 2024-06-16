// src/index.ts
import { toNodeListener } from "h3";

import c from "./config";
import l from "./logger";
import s from "./server";

s.listen({
  host: c.SERVER_HOST,
  port: c.SERVER_PORT,
}, () => {
  l.info(`Listening on ${c.BASE_URL}`);
});
