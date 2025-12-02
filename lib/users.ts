export interface MockIdpUser {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
  account?: string;
  services?: string[];
  rights?: string[];
  notes?: string;
}

function getMockIdpInternalUrl(): string {
  return process.env.MOCK_IDP_INTERNAL_URL || 'http://mock-idp:5000';
}

export function getMockIdpBrowserUrl(): string {
  return process.env.MOCK_IDP_BROWSER_URL || 'http://localhost:5000';
}

/**
 * Fetch the mock user catalog from mock-idp.
 * Uses the Docker internal URL so it works from the Next.js server runtime.
 */
export async function fetchMockUsers(): Promise<MockIdpUser[]> {
  const response = await fetch(`${getMockIdpInternalUrl()}/users.json`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load mock users: ${response.status} ${response.statusText} - ${text}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter((entry): entry is MockIdpUser => typeof entry?.email === 'string' && typeof entry?.id === 'string');
}

