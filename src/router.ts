// src/oauthHandlers.ts
import {
  createRouter,
  eventHandler,
  getCookie,
  getQuery,
  getRequestHost,
  sendRedirect,
  setCookie,
  setResponseStatus,
} from "h3";

import generatePKCE from "./pkce";

import c from "./config";
import e from "./edge";
import l from "./logger";

/**
 * Redirects OAuth requests to EdgeDB Auth OAuth authorize redirect
 * with the PKCE challenge, and saves PKCE verifier in an HttpOnly
 * cookie for later retrieval.
 */
const getAuthorize = eventHandler(async (event) => {
  const query = getQuery(event);

  const provider = query.provider as string;
  if (!provider) {
    l.debug("No provider found in search parameters");
    setResponseStatus(event, 400);
    event.node.res.end(
      "Must provider a 'provider' value in search parameters",
    );
    return;
  }

  l.debug(`Authorize Provider: ${provider}`);
  const host = getRequestHost(event);
  const pkce = generatePKCE();

  const redirectUrl = new URL("authorize", c.EDGEDB_BASE_URL);
  redirectUrl.searchParams.set("provider", provider);
  redirectUrl.searchParams.set("challenge", pkce.challenge);
  redirectUrl.searchParams.set(
    "redirect_to",
    `${host}/auth/callback`,
  );
  redirectUrl.searchParams.set(
    "redirect_to_on_signup",
    `${c.BASE_URL}/auth/callback?isSignUp=true`,
  );

  l.debug(`Authorize URL: ${redirectUrl.href}`);
  setCookie(event, "edgedb-pkce-verifier", pkce.verifier, {
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "strict",
  });

  l.debug(`Redirecting to ${redirectUrl.href}`);
  await sendRedirect(event, redirectUrl.href, 302);
});

/**
 * Handles the PKCE callback and exchanges the `code` and `verifier
 * for an auth_token, setting the auth_token as an HttpOnly cookie.
 */
const getCallback = eventHandler(async (event) => {
  const query = getQuery<Record<string, string>>(event);

  if (!query.code) {
    setResponseStatus(event, 400);
    event.node.res.end(`Error from the auth server: ${query.error}`);
    return;
  }

  const verifier = getCookie(event, "edgedb-pkce-verifier");
  if (!verifier) {
    l.error(
      `Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`,
    );
    setResponseStatus(event, 400);
    event.node.res.end(
      `Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`,
    );
    return;
  }

  const tokenUrl = new URL("token", c.EDGEDB_AUTH_BASE_URL);
  tokenUrl.searchParams.set("code", query.code);
  tokenUrl.searchParams.set("verifier", verifier);

  const tokenRes = await fetch(tokenUrl, { method: "GET" });
  if (!tokenRes.ok) {
    setResponseStatus(event, 400);
    event.node.res.end(`Error from the auth server: ${await tokenRes.text()}`);
    return;
  }

  const tokenData: {
    auth_token: string;
  } = await tokenRes.json();

  if (!tokenData.auth_token) {
    setResponseStatus(event, 400);
    event.node.res.end(`Error from the auth server: ${await tokenRes.text()}`);
    return;
  }

  if (query.isSignUp?.toString() === "true") {
    l.info(`Creating new user with auth token ${tokenData.auth_token}`);
    await e.withGlobals({
      "ext::auth::client_token": tokenData.auth_token,
    }).query(`
      insert User { identity := (global ext::auth::ClientTokenIdentity) };
    `);
  }

  setResponseStatus(event, 204);
  setCookie(event, `edgedb-auth-token`, tokenData.auth_token, {
    path: "/",
    secure: true,
    sameSite: "strict",
  });
});

const r = createRouter()
  .get("/auth/authorize", getAuthorize)
  .get("/auth/callback", getCallback);

export default r;
