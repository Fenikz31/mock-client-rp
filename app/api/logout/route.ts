import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  // Delete all auth-related cookies
  cookieStore.delete('id_token');
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  cookieStore.delete('oauth_state');
  
  // Get the origin from the request to build redirect URL
  const origin = request.headers.get('origin') || request.headers.get('referer') || 'http://localhost:8079';
  const baseUrl = new URL(origin).origin;
  
  // Redirect to home page
  return NextResponse.redirect(new URL('/', baseUrl));
}

