import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/oidc';
import { getConfig } from '@/lib/config';

/**
 * Route Handler for OAuth2 callback
 * Handles authorization code exchange and token storage
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const config = getConfig();
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  // Check for OAuth2 errors
  if (error) {
    const errorMsg = errorDescription || error;
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorMsg)}`, request.url)
    );
  }
  
  // Validate required parameters
  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=missing_code&error_description=Authorization code not provided', request.url)
    );
  }
  
  if (!state) {
    return NextResponse.redirect(
      new URL('/?error=missing_state&error_description=State parameter not provided', request.url)
    );
  }
  
  // Verify state against stored value (CSRF protection)
  const storedState = cookieStore.get('oauth_state')?.value;
  if (!storedState || storedState !== state) {
    cookieStore.delete('oauth_state');
    return NextResponse.redirect(
      new URL('/?error=invalid_state&error_description=State mismatch - possible CSRF attack', request.url)
    );
  }
  
  // Clear state cookie after verification
  cookieStore.delete('oauth_state');
  
  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code, config.redirectUri);
    
    // Store tokens in httpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    };
    
    cookieStore.set('id_token', tokenResponse.id_token, cookieOptions);
    cookieStore.set('access_token', tokenResponse.access_token, cookieOptions);
    
    if (tokenResponse.refresh_token) {
      cookieStore.set('refresh_token', tokenResponse.refresh_token, cookieOptions);
    }
    
    // Redirect to profile page
    return NextResponse.redirect(new URL('/profile', request.url));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/?error=token_exchange_failed&error_description=${encodeURIComponent(errorMsg)}`, request.url)
    );
  }
}

