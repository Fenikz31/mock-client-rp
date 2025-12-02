import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJWT, isTokenExpired, type JWTPayload } from '@/lib/oidc';
import Link from 'next/link';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('id_token');
  
  // Redirect to home if not authenticated
  if (!idToken?.value) {
    redirect('/');
  }
  
  // Decode JWT
  let payload: JWTPayload;
  let expired = false;
  let decodeError: string | null = null;
  
  try {
    payload = decodeJWT(idToken.value);
    expired = isTokenExpired(idToken.value);
  } catch (error) {
    decodeError = error instanceof Error ? error.message : 'Failed to decode token';
    payload = {};
  }
  
  // Format expiration date
  const expirationDate = payload.exp
    ? new Date(payload.exp * 1000).toLocaleString()
    : 'N/A';
  
  // Format issued at date
  const issuedAtDate = payload.iat
    ? new Date(payload.iat * 1000).toLocaleString()
    : 'N/A';
  
  // Separate standard OIDC claims from custom Questel claims
  const standardClaims: Record<string, unknown> = {};
  const questelClaims: Record<string, unknown> = {};
  
  Object.entries(payload).forEach(([key, value]) => {
    const standardKeys = [
      'sub', 'iss', 'aud', 'exp', 'iat', 'nbf', 'jti',
      'email', 'email_verified', 'name', 'given_name', 'family_name',
      'picture', 'locale', 'preferred_username',
    ];
    
    if (standardKeys.includes(key)) {
      standardClaims[key] = value;
    } else {
      questelClaims[key] = value;
    }
  });
  
  return (
    <div className="container">
      <div className="card">
        <h1>User Profile</h1>
        
        {decodeError && (
          <div className="error">
            <strong>Error decoding token:</strong> {decodeError}
          </div>
        )}
        
        {expired && (
          <div className="error">
            <strong>Token Expired:</strong> This token has expired. Please login again.
          </div>
        )}
        
        <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          <Link href="/api/logout">
            <button>Logout</button>
          </Link>
        </div>
        
        <h2>Standard OIDC Claims</h2>
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sub</code></td>
              <td>{String(payload.sub || 'N/A')}</td>
            </tr>
            <tr>
              <td><code>iss</code></td>
              <td>{String(payload.iss || 'N/A')}</td>
            </tr>
            <tr>
              <td><code>aud</code></td>
              <td>{Array.isArray(payload.aud) ? payload.aud.join(', ') : String(payload.aud || 'N/A')}</td>
            </tr>
            <tr>
              <td><code>exp</code></td>
              <td>
                {expirationDate}
                {expired && <span className="badge danger" style={{ marginLeft: '0.5rem' }}>EXPIRED</span>}
              </td>
            </tr>
            <tr>
              <td><code>iat</code></td>
              <td>{issuedAtDate}</td>
            </tr>
            {payload.email && (
              <tr>
                <td><code>email</code></td>
                <td>{String(payload.email)}</td>
              </tr>
            )}
            {payload.name && (
              <tr>
                <td><code>name</code></td>
                <td>{String(payload.name)}</td>
              </tr>
            )}
            {payload.given_name && (
              <tr>
                <td><code>given_name</code></td>
                <td>{String(payload.given_name)}</td>
              </tr>
            )}
            {payload.family_name && (
              <tr>
                <td><code>family_name</code></td>
                <td>{String(payload.family_name)}</td>
              </tr>
            )}
            {Object.entries(standardClaims)
              .filter(([key]) => !['sub', 'iss', 'aud', 'exp', 'iat', 'email', 'name', 'given_name', 'family_name'].includes(key))
              .map(([key, value]) => (
                <tr key={key}>
                  <td><code>{key}</code></td>
                  <td>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        
        {Object.keys(questelClaims).length > 0 && (
          <>
            <h2>Questel Custom Claims</h2>
            <table>
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(questelClaims).map(([key, value]) => (
                  <tr key={key}>
                    <td><code>{key}</code></td>
                    <td>
                      {typeof value === 'object' ? (
                        <pre>{JSON.stringify(value, null, 2)}</pre>
                      ) : (
                        String(value)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        
        <h2>Raw Token (for debugging)</h2>
        <details>
          <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Click to expand</summary>
          <pre style={{ fontSize: '0.8em', maxHeight: '400px', overflow: 'auto' }}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

