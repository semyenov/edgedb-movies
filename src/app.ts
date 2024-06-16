import { createApp, eventHandler, getRequestURL } from "h3";

import l from "./logger";
import r from "./router";

const logRequest = eventHandler((event) => {
  const url = getRequestURL(event);
  l.debug(`Request: ${url}`);
});

const a = createApp({
  debug: true,
  onError(error, event) {
    l.error(error.message, error);
  },
})
  .use("*", logRequest)
  .use("/", r.handler);

export default a;
