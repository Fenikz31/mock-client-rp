import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { getConfig, getAuthorizationEndpoint } from '@/lib/config';
import { generateState } from '@/lib/oidc';

/**
 * Route Handler for initiating OIDC login
 * Generates state and redirects to authorization endpoint
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Generate state for CSRF protection
  const state = generateState();
  
  // Store state in cookie (httpOnly for security)
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  
  const config = getConfig();
  const authEndpoint = getAuthorizationEndpoint();
  
  // Build authorization URL
  const authUrl = new URL(authEndpoint);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', config.scopes.join(' '));
  authUrl.searchParams.set('state', state);
  
  const loginHint = request.nextUrl.searchParams.get('login_hint') || request.nextUrl.searchParams.get('email');
  if (loginHint) {
    authUrl.searchParams.set('login_hint', loginHint);
  }
  const prompt = request.nextUrl.searchParams.get('prompt');
  if (prompt) {
    authUrl.searchParams.set('prompt', prompt);
  }
  
  // Redirect to authorization endpoint
  redirect(authUrl.toString());
}

