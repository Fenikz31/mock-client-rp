/**
 * OIDC Utilities
 * Functions for token exchange, JWT decoding, and user info retrieval
 */

import { decodeJwt } from 'jose';
import { getConfig, getTokenEndpoint, getUserInfoEndpoint } from './config';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token: string;
  scope?: string;
}

export interface JWTPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: unknown; // For custom claims (Questel, etc.)
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const config = getConfig();
  const tokenEndpoint = getTokenEndpoint();
  
  // Use internal Docker network URL for server-to-server communication
  // Replace localhost with oidc-server if running in Docker
  // Check if we're running in Docker (oidc-server hostname exists) or use the configured issuer
  let serverUrl = tokenEndpoint;
  if (process.env.OIDC_ISSUER && process.env.OIDC_ISSUER.includes('oidc-server')) {
    // Already using Docker internal network
    serverUrl = tokenEndpoint;
  } else if (tokenEndpoint.includes('localhost:8080')) {
    // Replace localhost with oidc-server for Docker internal communication
    serverUrl = tokenEndpoint.replace('http://localhost:8080', 'http://oidc-server:8080');
  }
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  
  const response = await fetch(serverUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json() as TokenResponse;
}

/**
 * Decode JWT without signature verification (for mock/testing purposes)
 */
export function decodeJWT(token: string): JWTPayload {
  try {
    return decodeJwt(token) as JWTPayload;
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJWT(token);
    if (!payload.exp) {
      return false; // No expiration claim, consider as not expired
    }
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true; // If we can't decode, consider expired
  }
}

/**
 * Get user info from userinfo endpoint
 */
export async function getUserInfo(accessToken: string): Promise<Record<string, unknown>> {
  const userInfoEndpoint = getUserInfoEndpoint();
  
  // Use internal Docker network URL for server-to-server communication
  // Check if we're running in Docker (oidc-server hostname exists) or use the configured issuer
  let serverUrl = userInfoEndpoint;
  if (process.env.OIDC_ISSUER && process.env.OIDC_ISSUER.includes('oidc-server')) {
    // Already using Docker internal network
    serverUrl = userInfoEndpoint;
  } else if (userInfoEndpoint.includes('localhost:8080')) {
    // Replace localhost with oidc-server for Docker internal communication
    serverUrl = userInfoEndpoint.replace('http://localhost:8080', 'http://oidc-server:8080');
  }
  
  const response = await fetch(serverUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`UserInfo request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json() as Record<string, unknown>;
}

/**
 * Generate a random state value for CSRF protection
 */
export function generateState(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

