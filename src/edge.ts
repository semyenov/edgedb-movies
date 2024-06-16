// src/edge.ts
import { createClient } from "edgedb";

const e = createClient({
  host: "localhost",
  port: 5656,
  user: "edgedb",
  password: "secret",
  database: "main",
  branch: "master",
  logging: true,
});

export default e;
