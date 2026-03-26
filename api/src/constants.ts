/**
 * BayLeaf API Constants
 */

/** OIDC endpoint discovery result */
export interface OIDCEndpoints {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
}

/**
 * Fetch OIDC endpoints from the provider's .well-known/openid-configuration.
 * Works with any compliant provider (CILogon, Google, Keycloak, Dex, etc.).
 */
export async function discoverOIDC(issuer: string): Promise<OIDCEndpoints> {
  const url = `${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status} from ${url}`);
  const doc = await res.json() as OIDCEndpoints;
  if (!doc.authorization_endpoint || !doc.token_endpoint || !doc.userinfo_endpoint) {
    throw new Error(`OIDC discovery response missing required endpoints from ${url}`);
  }
  return doc;
}

export const OPENROUTER_API = 'https://openrouter.ai/api/v1';

export const SESSION_COOKIE = 'bayleaf_session';
export const SESSION_DURATION_HOURS = 24;

export const BAYLEAF_TOKEN_PREFIX = 'sk-bayleaf-';

export const DAYTONA_DEFAULT_API_URL = 'https://app.daytona.io/api';
export const DAYTONA_DEFAULT_PROXY_URL = 'https://proxy.app.daytona.io/toolbox';
