// src/config.ts
import { URL } from "node:url";

import { loadConfig } from "c12";

import l from "./logger";

interface UserInputConfig {
  EDGEDB_BASE_URL: string;
  EDGEDB_AUTH_BASE_URL: string;

  BASE_URL: string | null;
  SERVER_HOST: string | null;
  SERVER_PORT: number | null;
}

const { config: c } = await loadConfig<UserInputConfig>({
  name: "edgedb",
  cwd: process.cwd(),

  defaults: {
    BASE_URL: "http://localhost:3000",
    EDGEDB_BASE_URL: "https://edgedb.com",
    EDGEDB_AUTH_BASE_URL: "https://edgedb-auth.edgedb.com",

    SERVER_HOST: "localhost",
    SERVER_PORT: 3000,
  },
});

if (!c) {
  throw new Error("Could not load config");
}

if (!c.BASE_URL) {
  if (!c.SERVER_HOST) {
    throw new Error("Could not get BASE_URL or SERVER_HOST");
  }

  c.BASE_URL = `http://${
    c.SERVER_PORT ? `${c.SERVER_HOST}:${c.SERVER_PORT}` : c.SERVER_HOST
  }`;
}

const u = new URL(c.BASE_URL);
c.SERVER_HOST = u.hostname;
c.SERVER_PORT = parseInt(u.port);

l.debug("Loaded config:", c);

export default c!;
