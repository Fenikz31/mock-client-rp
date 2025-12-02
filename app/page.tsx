import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getConfig } from '@/lib/config';
import { fetchMockUsers, type MockIdpUser, getMockIdpBrowserUrl } from '@/lib/users';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('id_token');
  
  // If already authenticated, redirect to profile
  if (idToken?.value) {
    redirect('/profile');
  }
  
  // Check for OAuth2 errors
  const params = await searchParams;
  const error = params.error;
  const errorDescription = params.error_description;
  
  const config = getConfig();
  let users: MockIdpUser[] = [];
  let userCatalogError: string | null = null;
  try {
    users = await fetchMockUsers();
  } catch (err) {
    userCatalogError = err instanceof Error ? err.message : 'Unable to load mock users';
  }
  const defaultLoginHint = users[0]?.email ?? '';
  
  return (
    <div className="container">
      <div className="card">
        <h1>Mock OIDC Client RP</h1>
        <p>This is a mock Relying Party client for testing the OIDC cascade workflow.</p>
        
        {error && (
          <div className="error">
            <strong>Authentication Error:</strong>
            <p>{error}</p>
            {errorDescription && <p>{errorDescription}</p>}
          </div>
        )}
            {userCatalogError ? (
              <div className="error" data-testid="mock-user-error">
                <strong>User catalog unavailable:</strong>
                <p>{userCatalogError}</p>
              </div>
            ) : (
              <form
                action="/api/auth/login"
                method="GET"
                style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {users.length === 0 && (
                  <p style={{ color: '#b45309' }}>
                    No mock identities configured. Update users.json in mock-idp to add test users.
                  </p>
                )}
                <label htmlFor="login_hint">
                  Choose a mock identity
                  <select
                    id="login_hint"
                    name="login_hint"
                    defaultValue={defaultLoginHint}
                    data-testid="mock-user-select"
                    style={{ marginTop: '0.4rem' }}
                    disabled={users.length === 0}
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.email}>
                        {user.firstname} {user.lastname} ({user.email})
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" data-testid="login-button" disabled={users.length === 0}>
                  Login with OIDC
                </button>
              </form>
            )}
            
            {users.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h2>Available identities</h2>
                <p style={{ fontSize: '0.9em' }}>
                  Served from {getMockIdpBrowserUrl()}/users.json
                </p>
                <table style={{ width: '100%', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th align="left">Name</th>
                      <th align="left">Email</th>
                      <th align="left">Account</th>
                      <th align="left">Services</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={`${user.id}-details`}>
                        <td>{`${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() || user.id}</td>
                        <td>{user.email}</td>
                        <td>{user.account || '-'}</td>
                        <td>{user.services?.join(', ') || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        
        <div style={{ marginTop: '2rem', fontSize: '0.9em', color: '#666' }}>
          <p><strong>Configuration:</strong></p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Issuer: {config.issuer}</li>
            <li>Client ID: {config.clientId}</li>
            <li>Redirect URI: {config.redirectUri}</li>
            <li>Scopes: {config.scopes.join(', ')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

