# Google OAuth setup (readers)

Used by step **029**. Locally optional — leave `GOOGLE_*` empty to hide “Continue with Google”.

## 1. Google Cloud Console

1. Create (or select) a project at [Google Cloud Console](https://console.cloud.google.com/).
2. **APIs & Services → OAuth consent screen**: External (or Internal for Workspace-only). Add scopes `email`, `profile`, `openid`.
3. **Credentials → Create credentials → OAuth client ID → Web application**.
4. Authorized JavaScript origins: `http://localhost:3000` (and production origin).
5. Authorized redirect URIs:
   - Local: `http://localhost:3000/api/users/oauth/google/callback`
   - Prod: `https://<your-domain>/api/users/oauth/google/callback`
6. Copy Client ID and Client Secret into `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

Restart `npm run dev`. Login page shows “Continue with Google” when `GOOGLE_CLIENT_ID` is set.

## 2. Behaviour

- Authorize URL: `/api/users/oauth/google`
- Success → `/uk`; failure → `/uk/login?error=…` (ADR-004 default locale)
- Account linking by email: [ADR-002](./adr/002-auth-verification-and-account-linking.md)

## 3. Verify

1. Open `/uk/login` → Continue with Google.
2. Complete Google consent.
3. Land on `/uk` signed in as reader (`role: reader`); `/admin` still denied for that account.
