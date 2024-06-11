// src/env.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

const readEnvFile = (path: string) => {
  const filePath = join(path);
  const fileContents = readFileSync(filePath, "utf8");
  return fileContents.trim();
};

const setEnv = (key: string, value: string) => {
  process.env[key] = value;
};

const loadEnv = (path: string) => {
  const filePath = join(__dirname, path);
  const fileContents = readEnvFile(filePath);
  const envLines = fileContents.split("\n");

  for (const line of envLines) {
    const [key, value] = line.split("=");
    if (key && value) {
      setEnv(key, value);
    }
  }
};

const getEnv = <T = string>(key: string) => {
  const value = process.env[key];
  if (value !== undefined) {
    return value as T;
  }

  throw new Error(`Missing environment variable: ${key}`);
};

loadEnv("../.env");
const BASE_URL = getEnv("BASE_URL");

const u = new URL(BASE_URL);
const SERVER_PROTOCOL = u.protocol;
const SERVER_HOST = u.hostname;
const SERVER_PORT = parseInt(u.port);

const EDGEDB_BASE_URL = getEnv("EDGEDB_BASE_URL");
const EDGEDB_AUTH_BASE_URL = getEnv("EDGEDB_AUTH_BASE_URL");

export {
  BASE_URL,
  EDGEDB_AUTH_BASE_URL,
  EDGEDB_BASE_URL,
  SERVER_HOST,
  SERVER_PORT,
  SERVER_PROTOCOL,
};
