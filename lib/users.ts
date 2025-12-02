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
  return process.env.MOCK_IDP_INTERNAL_URL || 'http://fenikz.eu:5001';
}

export function getMockIdpBrowserUrl(): string {
  return process.env.MOCK_IDP_BROWSER_URL || 'http://fenikz.eu:5001';
}

/**
 * Fetch the mock user catalog from mock-idp.
 * Uses the Docker internal URL so it works from the Next.js server runtime.
 */
export async function fetchMockUsers(): Promise<MockIdpUser[]> {
  const response = await fetch(`${getMockIdpInternalUrl()}/users.json`, {
    cache: 'no-store',
  });

  // console.log('response', response);
  // console.log('response.ok', response.ok);
  // console.log('response.status', response.status);
  // console.log('response.statusText', response.statusText);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load mock users: ${response.status} ${response.statusText} - ${text}`);
    // return [
    //   {
    //     "id": "test_oidc_admin",
    //     "email": "test1_sso@yopmail.com",
    //     "firstname": "Test",
    //     "lastname": "OIDC",
    //     "account": "test-account",
    //     "services": ["EQCORPORATEPLUS"],
    //     "rights": ["read", "write"],
    //     "notes": "Legacy integration test user already present in UMv2"
    //   },
    //   {
    //     "id": "auto_provision_student",
    //     "email": "student.mock@questel.com",
    //     "firstname": "Student",
    //     "lastname": "Mock",
    //     "account": "auto-provision",
    //     "services": ["BASIC"],
    //     "rights": ["read"],
    //     "notes": "Should be created dynamically via upcoming autoprovision"
    //   },
    //   {
    //     "id": "auto_provision_admin",
    //     "email": "admin.mock@questel.com",
    //     "firstname": "Admin",
    //     "lastname": "Mock",
    //     "account": "auto-provision",
    //     "services": ["EQCORPORATEPLUS"],
    //     "rights": ["admin"],
    //     "notes": "Second profile for multi-user testing"
    //   }
    // ] as MockIdpUser[];    
  }

  const data = (await response.json()) as unknown;
  console.log('data', data);
  if (!Array.isArray(data)) {
    return [];
  }
  if data.length === 0 {
    return [
      {
        "id": "test_oidc_admin",
        "email": "test1_sso@yopmail.com",
        "firstname": "Test",
        "lastname": "OIDC",
        "account": "test-account",
        "services": ["EQCORPORATEPLUS"],
        "rights": ["read", "write"],
        "notes": "Legacy integration test user already present in UMv2"
      },
      {
        "id": "auto_provision_student",
        "email": "student.mock@questel.com",
        "firstname": "Student",
        "lastname": "Mock",
        "account": "auto-provision",
        "services": ["BASIC"],
        "rights": ["read"],
        "notes": "Should be created dynamically via upcoming autoprovision"
      },
      {
        "id": "auto_provision_admin",
        "email": "admin.mock@questel.com",
        "firstname": "Admin",
        "lastname": "Mock",
        "account": "auto-provision",
        "services": ["EQCORPORATEPLUS"],
        "rights": ["admin"],
        "notes": "Second profile for multi-user testing"
      }
    ] as MockIdpUser[];
  }
  return data.filter((entry): entry is MockIdpUser => typeof entry?.email === 'string' && typeof entry?.id === 'string');
}

