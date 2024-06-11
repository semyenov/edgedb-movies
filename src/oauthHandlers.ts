// src/oauthHandlers.ts
import {
  eventHandler,
  getCookie,
  getQuery,
  getRequestHost,
  sendRedirect,
  setCookie,
  setResponseStatus,
} from "h3";

import { EDGEDB_AUTH_BASE_URL, EDGEDB_BASE_URL, SERVER_PORT } from "./env";
import generatePKCE from "./pkceGenerator";
import logger from "./logger";
import client from "./edge";

/**
 * Redirects OAuth requests to EdgeDB Auth OAuth authorize redirect
 * with the PKCE challenge, and saves PKCE verifier in an HttpOnly
 * cookie for later retrieval.
 */
const handleAuthorize = eventHandler(async (event) => {
  const host = getRequestHost(event);
  const query = getQuery(event);
  const provider = query.provider as string;

  logger.debug(`Authorize Provider: ${provider}`);
  if (!provider) {
    logger.debug("No provider found in search parameters");
    setResponseStatus(event, 400);
    event.node.res.end("Must provider a 'provider' value in search parameters");
    return;
  }

  const pkce = generatePKCE();

  const redirectUrl = new URL("authorize", EDGEDB_BASE_URL);
  redirectUrl.searchParams.set("provider", provider);
  redirectUrl.searchParams.set("challenge", pkce.challenge);
  redirectUrl.searchParams.set(
    "redirect_to",
    `${host}/auth/callback`,
  );
  redirectUrl.searchParams.set(
    "redirect_to_on_signup",
    `http://localhost:${SERVER_PORT}/auth/callback?isSignUp=true`,
  );

  logger.debug(`Authorize URL: ${redirectUrl.href}`);
  setCookie(event, "edgedb-pkce-verifier", pkce.verifier, {
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "strict",
  });

  logger.debug(`Redirecting to ${redirectUrl.href}`);
  await sendRedirect(event, redirectUrl.href, 302);
});

/**
 * Handles the PKCE callback and exchanges the `code` and `verifier
 * for an auth_token, setting the auth_token as an HttpOnly cookie.
 */
const handleCallback = eventHandler(async (event) => {
  const query = getQuery(event);

  const code = query.code as string;
  if (!code) {
    const error = getQuery(event).error as string;
    setResponseStatus(event, 400);
    event.node.res.end(`Error from the auth server: ${error}`);
    return;
  }

  const verifier = getCookie(event, "edgedb-pkce-verifier");
  if (!verifier) {
    logger.error(
      `Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`,
    );
    event.respondWith(
      new Response(
        `Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`,
        { status: 400, headers: { "Content-Type": "text/plain" } },
      ),
    );
    return;
  }

  const tokenUrl = new URL("token", EDGEDB_AUTH_BASE_URL);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("verifier", verifier);

  const tokenRes = await fetch(tokenUrl, { method: "GET" });
  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    setResponseStatus(event, 400);
    event.node.res.end(`Error from the auth server: ${error}`);
    return;
  }

  const { auth_token } = await tokenRes.json() as {
    auth_token: string;
  };

  const isSignUp = query.isSignUp as string === "true";
  if (isSignUp) {
    logger.info("Creating new user");
    await client.withGlobals({
      "ext::auth::client_token": auth_token,
    }).query(`
      insert User { identity := (global ext::auth::ClientTokenIdentity) };
    `);
  }

  logger.debug(`Auth Token: ${auth_token}`);
  setResponseStatus(event, 204);
  setCookie(event, `edgedb-auth-token`, auth_token, {
    path: "/",
    secure: true,
    sameSite: "strict",
  });
});

export { handleAuthorize, handleCallback };
