// src/pkceGenerator.ts
import crypto from "node:crypto";

import logger from "./logger";

const generatePKCE = () => {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest(
    "base64url",
  );

  logger.debug(`PKCE: ${verifier} ${challenge}`);
  return { verifier, challenge };
};

export default generatePKCE;
