import { NextRequest, NextResponse } from 'next/server';

/**
 * Callback Route Handler that redirects to the auth callback handler
 * This maintains compatibility with existing OAuth2 redirect_uri configuration
 * which points to /callback
 */
export async function GET(request: NextRequest) {
  // Forward all query parameters to the auth callback handler
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = new URL('/api/auth/callback', request.url);
  
  // Copy all query parameters
  searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });
  
  return NextResponse.redirect(redirectUrl);
}

