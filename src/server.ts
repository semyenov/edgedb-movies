import { createServer } from "node:http";
import a from "./app";
import { toNodeListener } from "h3";

const listener = toNodeListener(a);
const s = createServer(listener);

export default s;
