# Mock OIDC Client RP

Mock Relying Party (RP) client built with Next.js 15+ for testing the OIDC cascade workflow.

## Overview

This mock client implements a complete OIDC Relying Party that:
- Initiates OIDC authorization flow
- Handles OAuth2 callback with authorization code
- Exchanges authorization code for tokens
- Displays decoded JWT claims (standard OIDC + Questel custom claims)
- Provides logout functionality

## Technology Stack

- **Next.js 15.5+** with App Router
- **React 19.2**
- **TypeScript**
- **jose 6.x** for JWT decoding
- **Node.js 18+**

## Quick Start

### Using Docker Compose

```bash
# Start all services (oidc-server, mock-idp, mock-client-rp)
make up-test

# OR start only the mock client RP
docker compose -f docker-compose/local/dev/docker-compose.yml --profile test --profile oidc-test up -d mock-client-rp
```

Access the client at: `http://localhost:8079`

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Configuration

Environment variables (configured in `docker-compose.yml` or `.env`):

- `OIDC_ISSUER`: OIDC server URL (default: `http://oidc-server:8080`)
- `OIDC_CLIENT_ID`: OAuth2 client ID (default: `test-oidc-cascade-client`)
- `OIDC_CLIENT_SECRET`: OAuth2 client secret (default: `test-client-secret`)
- `OIDC_REDIRECT_URI`: Callback URL (default: `http://localhost:8079/callback`)
- `OIDC_SCOPES`: Requested scopes (default: `openid profile email qp account`)
- `PORT`: Server port (default: `8079`)
- `MOCK_IDP_INTERNAL_URL`: Internal URL used by the Next.js server runtime to reach mock-idp (default: `http://mock-idp:5000`)
- `MOCK_IDP_BROWSER_URL`: Browser-accessible URL for mock-idp (default: `http://localhost:5000`)

## Database Configuration

Before using the mock client RP, add the redirect URI to the database:

```sql
INSERT INTO client_redirect_uri VALUES
(99, 'http://localhost:8079/callback');
```

## Features

### Home Page (`/`)

- Lists the mock users advertised by `mock-idp/users.json`
- Provides a dropdown to select which mock identity should be used (sets `login_hint`)
- Displays login button
- Shows OIDC configuration
- Handles OAuth2 errors

### Callback Page (`/callback`)

- Receives authorization code from OIDC server
- Validates state parameter (CSRF protection)
- Exchanges code for tokens
- Stores tokens in httpOnly cookies
- Redirects to profile page

### Profile Page (`/profile`)

- Displays decoded JWT claims:
  - Standard OIDC claims: `sub`, `iss`, `aud`, `exp`, `iat`, `email`, `name`, etc.
  - Questel custom claims: `SESSION_TICKET`, `qp_login`, `account_id`, `account_name`, etc.
- Shows token expiration status
- Provides logout button

### Mock User Catalog

- The mock IdP exposes `http://localhost:5000/users.json`, sourced from `mock-idp/users.json`
- Each entry contains `id`, `email`, `firstname`, `lastname`, `account`, `services`, `rights`, `notes`
- The client fetches this catalog on every page load (no caching) to stay in sync with the IdP
- Selecting a user sends its email as `login_hint`, helping mock-idp auto-fill the login form

### Logout API (`/api/logout`)

- Clears all authentication cookies
- Redirects to home page

## Security

- Tokens stored in httpOnly cookies (not accessible via JavaScript)
- State parameter validation for CSRF protection
- Secure cookie flags in production mode
- No signature verification (mock/testing purposes only)

## Architecture

- **App Router**: Next.js 15+ App Router with Server Components
- **Server Components**: Default rendering on server
- **Route Handlers**: API routes using Next.js Route Handlers
- **Cookies**: Next.js `cookies()` API for secure session management

## Development

### Project Structure

```
mock-client-rp/
├── app/              # App Router pages
│   ├── layout.tsx   # Root layout
│   ├── page.tsx     # Home page
│   ├── callback/    # OAuth2 callback
│   ├── profile/     # User profile
│   └── api/         # API routes
├── lib/             # Utilities
│   ├── config.ts    # OIDC configuration
│   └── oidc.ts      # OIDC utilities
└── styles/          # Global styles
```

### Building for Production

```bash
npm run build
npm start
```

### Docker Build

```bash
docker build -t mock-client-rp:latest .
```

## Troubleshooting

### Port Already in Use

Change the port via environment variable:

```bash
PORT=8080 npm run dev
```

### Cannot Connect to OIDC Server

Ensure the `OIDC_ISSUER` environment variable is correct:
- From Docker container: `http://oidc-server:8080`
- From host machine: `http://localhost:8080`

### State Mismatch Error

This indicates a CSRF attack or session issue. Clear cookies and try again.

## License

Internal use only - Questel SSO project
