import http, { RequestListener } from "node:http";
import { URL } from "node:url";
import crypto from "node:crypto";
import { createClient } from "edgedb";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/debug.log", level: "debug" }),
    new winston.transports.File({ filename: "logs/errors.log", level: "error" }),
  ],
});

/**
 * You can get this value by running `edgedb instance credentials`.
 * Value should be:
 * `${protocol}://${host}:${port}/branch/${branch}/ext/auth/
 */
const SERVER_PORT = 3000;
const EDGEDB_AUTH_BASE_URL = process.env.EDGEDB_AUTH_BASE_URL;

/**
 * Generate a random Base64 url-encoded string, and derive a "challenge"
 * string from that string to use as proof that the request for a token
 * later is made from the same user agent that made the original request
 */
const generatePKCE = () => {
  logger.debug("Generating PKCE...");
  const verifier = crypto.randomBytes(32).toString("base64url");
  logger.debug(`Verifier generated: ${verifier}`);

  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  logger.debug(`Challenge generated: ${challenge}`);

  return { verifier, challenge };
};

const server = http.createServer(async (req, res) => {
  const requestUrl = getRequestUrl(req);
  logger.info(`${req.method} ${req.url}`);

  switch (requestUrl.pathname) {
    case "/auth/authorize": {
      await handleAuthorize(req, res);
      break;
    }

    case "/auth/callback": {
      await handleCallback(req, res);
      break;
    }

    default: {
      logger.debug("Route not found, returning 404");
      res.writeHead(404);
      res.end("Not found");
      break;
    }
  }
});

const client = createClient({});

/**
 * Redirects OAuth requests to EdgeDB Auth OAuth authorize redirect
 * with the PKCE challenge, and saves PKCE verifier in an HttpOnly
 * cookie for later retrieval.
 */
const handleAuthorize: RequestListener = async (
  req,
  res,
) => {
  logger.debug("Authorize request...");
  const requestUrl = getRequestUrl(req);
  const provider = requestUrl.searchParams.get("provider");
  logger.debug(`Authorize Provider: ${provider}`);

  if (!provider) {
    logger.debug("No provider found in search parameters");
    res.statusCode = 400;
    res.end("Must provider a 'provider' value in search parameters");
    return;
  }

  const pkce = generatePKCE();
  const redirectUrl = new URL("authorize", EDGEDB_AUTH_BASE_URL);
  redirectUrl.searchParams.set("provider", provider);
  redirectUrl.searchParams.set("challenge", pkce.challenge);
  redirectUrl.searchParams.set(
    "redirect_to",
    `http://localhost:${SERVER_PORT}/auth/callback`,
  );
  redirectUrl.searchParams.set(
    "redirect_to_on_signup",
    `http://localhost:${SERVER_PORT}/auth/callback?isSignUp=true`,
  );

  logger.debug(`Authorize URL: ${redirectUrl.href}`);
  res.writeHead(302, {
    "Set-Cookie":
      `edgedb-pkce-verifier=${pkce.verifier}; HttpOnly; Path=/; Secure;  SameSite=Strict`,
    Location: redirectUrl.href,
  });
  res.end();
};

/**
 * Handles the PKCE callback and exchanges the `code` and `verifier
 * for an auth_token, setting the auth_token as an HttpOnly cookie.
 */
const handleCallback: RequestListener = async (req, res) => {
  logger.debug("Callback request...");
  const requestUrl = getRequestUrl(req);
  logger.debug(`Callback URL: ${requestUrl.href}`);

  console.log(req);

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    const error = requestUrl.searchParams.get("error");
    logger.error(
      `OAuth callback is missing 'code'. OAuth provider responded with error: ${error}`,
    );
    res.statusCode = 400;
    res.end(
      `OAuth callback is missing 'code'. OAuth provider responded with error: ${error}`,
    );
    return;
  }

  const cookies = req.headers.cookie?.split("; ");
  const verifier = cookies
    ?.find((cookie) => cookie.startsWith("edgedb-pkce-verifier="))
    ?.split("=")[1];
  if (!verifier) {
    logger.error(
      `Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`,
    );
    res.statusCode = 400;
    res.end(
      `Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`,
    );
    return;
  }

  const codeExchangeUrl = new URL("token", EDGEDB_AUTH_BASE_URL);
  codeExchangeUrl.searchParams.set("code", code);
  codeExchangeUrl.searchParams.set("verifier", verifier);
  const codeExchangeResponse = await fetch(codeExchangeUrl.href, {
    method: "GET",
  });

  if (!codeExchangeResponse.ok) {
    const text = await codeExchangeResponse.text();
    logger.error(`Error from the auth server: ${text}`);
    res.statusCode = 400;
    res.end(`Error from the auth server: ${text}`);
    return;
  }

  const { auth_token } = await codeExchangeResponse.json() as {
    auth_token: string;
  };

  const isSignUp = requestUrl.searchParams.get("isSignUp");
  if (isSignUp === "true") {
    logger.info("User logged in for the first time, creating a new user");
    const authedClient = client.withGlobals({
      "ext::auth::client_token": auth_token,
    });
    await authedClient.query(`
    insert User {
      identity := (global ext::auth::ClientTokenIdentity)
    };
  `);
  }

  logger.debug(`Auth Token: ${auth_token}`);

  res.writeHead(204, {
    "Set-Cookie": `edgedb-auth-token=${auth_token}; HttpOnly; Path=/; Secure; SameSite=Strict`,
  });
  res.end();
};

const getRequestUrl = (req: http.IncomingMessage) => {
  logger.debug("Getting request URL...");
  const url = new URL(req.url!, `http://${req.headers.host}`);
  logger.debug(`Request URL: ${url.href}`);
  return url;
};

server.listen(SERVER_PORT, () => {
  logger.info(`Server running on http://localhost:${SERVER_PORT}`);
});
