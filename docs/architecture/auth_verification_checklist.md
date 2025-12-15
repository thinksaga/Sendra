# Authentication Verification Checklist

## 1. Manual Verification Checklist (Step-by-Step)

### Prerequisites
- [ ] **Infrastructure**: Docker containers (`keycloak`, `postgres`, `redis`) are running (`docker-compose up -d`).
- [ ] **Backend**: Sendra API is running (`pnpm start:api` / `nest start`).
- [ ] **Keycloak**: Realm `Sendra` is imported. Client `sendra-api` exists.
- [ ] **User**: A test user exists in Keycloak (e.g., `test-user@sendra.local`).

### Step 1: Obtain a Valid Token
**Action**: Use Postman or `curl` to login to Keycloak directly (Resource Owner Password Flow *for testing only* or Auth Code Flow if UI is ready).
```bash
curl -X POST "http://localhost:8080/realms/Sendra/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=sendra-web" \
     -d "username=test-user@sendra.local" \
     -d "password=password" \
     -d "grant_type=password"
```
**Verification**:
- [ ] Response contains `access_token` (JWT).
- [ ] Response contains `refresh_token`.
- [ ] `access_token` can be decoded (jwt.io) and issuer (`iss`) matches `KEYCLOAK_ISSUER_URL`.

### Step 2: Verify Protected Endpoint
**Action**: Call `GET http://localhost:3000/auth/me` with the token.
- Header: `Authorization: Bearer <access_token>`
**Verification**:
- [ ] Status Code: `200 OK`.
- [ ] Response Body: JSON containing `user` object with `email`, `keycloakId` loaded from token.

### Step 3: Verify Public Endpoint
**Action**: Call `GET http://localhost:3000/auth/public` WITHOUT token.
**Verification**:
- [ ] Status Code: `200 OK`.
- [ ] Response Body: `{ "message": "This is public" }`.

---

## 2. Test Cases & Expected Outcomes

| Test Case | Request Details | Expected Status | Expected Body / Log |
| :--- | :--- | :--- | :--- |
| **Valid Token** | Header: `Authorization: Bearer <valid_jwt>` | `200 OK` | `{ user: { email: "...", id: "..." } }` |
| **No Token** | No `Authorization` header | `401 Unauthorized` | `{ "statusCode": 401, "message": "Unauthorized" }` |
| **Expired Token** | JWT with `exp` in the past | `401 Unauthorized` | `{ "message": "Unauthorized" }` |
| **Wrong Signature** | JWT modified manually (tampered) | `401 Unauthorized` | Log: `JwtStrategy` error or Passport failure |
| **Wrong Audience** | JWT from different client (if aud checked) | `401 Unauthorized` | Log: `Audience invalid` |
| **Malformed Token** | `Authorization: Bearer not-a-jwt` | `401 Unauthorized` | `{ "message": "Unauthorized" }` |

---

## 3. Common Misconfigurations & Detection

### A. JWKS URL Failure
-   **Symptom**: All valid tokens return 401. Backend logs show connection refused or timeout to Keycloak.
-   **Detection**: Check backend container logs. Look for `AxiosError` or `ECONNREFUSED` when fetching `/.well-known/openid-configuration`.
-   **Fix**: Ensure backend (host) can reach Keycloak (docker info/port mapping). Use `localhost:8080` if on host, or `keycloak:8080` if dockerized.

### B. Clock Skew
-   **Symptom**: Token valid on issuance but rejected immediately.
-   **Detection**: Check `exp` claim vs Backend System Time.
-   **Fix**: Sync clocks or add `clockTolerance` in `JwtStrategy`.

### C. Issuer Mismatch
-   **Symptom**: 401 Unauthorized.
-   **Detection**: Decode JWT `iss` claim. Compare with `KEYCLOAK_ISSUER_URL` env var.
-   **Fix**: Must be exact string match (e.g. `http://localhost:8080/realms/Sendra` vs `http://127.0.0.1...`).

---

## 4. Pass / Fail Criteria

**PASS Criteria (Move to Workspace Dev)**:
1.  [ ] `GET /auth/me` returns 200 with correct Keycloak User ID.
2.  [ ] `GET /auth/me` returns 401 for expired/missing tokens.
3.  [ ] Backend logs show no errors during valid requests.
4.  [ ] `CurrentUser` decorator correctly extracts `email` and `sub`.

**FAIL Criteria (Stop & Fix)**:
1.  [ ] Any 500 Internal Server error during Auth.
2.  [ ] Valid tokens rejected consistently (Network/Config issue).
3.  [ ] Public endpoints require Auth (Guard misconfigured).
