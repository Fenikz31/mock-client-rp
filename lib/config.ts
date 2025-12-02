/**
 * OIDC Configuration
 * Reads configuration from environment variables
 */

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  port: number;
}

/**
 * Get OIDC configuration from environment variables
 */
export function getConfig(): OIDCConfig {
  const port = parseInt(process.env.PORT || process.env.MOCK_CLIENT_PORT || '8079', 10);
  
  // For redirect URI, use localhost from browser perspective
  const redirectUri = process.env.OIDC_REDIRECT_URI || `http://localhost:${port}/callback`;
  
  // For issuer, use internal Docker network name when running in container
  // This will be overridden by environment variables
  // Note: This is used for server-to-server communication
  const issuer = process.env.OIDC_ISSUER || 'http://oidc-server:8080';
  
  const scopes = (process.env.OIDC_SCOPES || 'openid profile email qp account').split(' ');
  
  return {
    issuer,
    clientId: process.env.OIDC_CLIENT_ID || 'test-oidc-cascade-client',
    clientSecret: process.env.OIDC_CLIENT_SECRET || 'test-client-secret',
    redirectUri,
    scopes,
    port,
  };
}

/**
 * Get the issuer URL for browser requests (must use localhost)
 * This is different from the internal issuer URL used for server-to-server communication
 */
export function getBrowserIssuer(): string {
  // Check if we have a browser-specific issuer URL
  const browserIssuer = process.env.OIDC_BROWSER_ISSUER;
  if (browserIssuer) {
    return browserIssuer;
  }
  
  // Otherwise, convert internal Docker hostname to localhost for browser
  const issuer = process.env.OIDC_ISSUER || 'http://oidc-server:8080';
  
  // Replace Docker internal hostnames with localhost for browser access
  if (issuer.includes('oidc-server')) {
    return issuer.replace('oidc-server', 'localhost');
  }
  
  // If already using localhost or external URL, return as-is
  return issuer;
}

/**
 * Get the authorization endpoint URL for browser requests
 * Uses localhost instead of Docker internal hostname
 */
export function getAuthorizationEndpoint(): string {
  const browserIssuer = getBrowserIssuer();
  return `${browserIssuer}/authorize`;
}

/**
 * Get the token endpoint URL
 */
export function getTokenEndpoint(): string {
  const config = getConfig();
  return `${config.issuer}/token`;
}

/**
 * Get the userinfo endpoint URL
 */
export function getUserInfoEndpoint(): string {
  const config = getConfig();
  return `${config.issuer}/userinfo`;
}

