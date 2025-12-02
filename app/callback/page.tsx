import { redirect } from 'next/navigation';

/**
 * Callback page that redirects to the Route Handler API
 * This maintains compatibility with existing OAuth2 redirect_uri configuration
 * which points to /callback
 */
export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Build query string from searchParams
  const queryString = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => queryString.append(key, v));
      } else {
        queryString.set(key, value);
      }
    }
  }
  
  // Redirect to Route Handler API
  redirect(`/api/auth/callback?${queryString.toString()}`);
}
