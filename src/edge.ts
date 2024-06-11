// src/edge.ts
import { ConnectOptions, createClient } from "edgedb";

const connectOptions: ConnectOptions = {
  host: "localhost",
  port: 5656,
  user: "edgedb",
  password: "secret",
  database: "main",
  branch: "master",
  logging: true,
};

export const client = createClient(connectOptions);

export default client;
