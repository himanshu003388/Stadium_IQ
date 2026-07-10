# SECURITY.md - Stadium IQ Security Policy & Key Rotation Procedures

This document outlines the security policies, defense-in-depth measures, and standard operating procedures for key rotation within the Stadium IQ tournament platform.

---

## Key Rotation Procedures

To limit the impact of potential key exposure or cryptographic degradation, Stadium IQ enforces a regular key-rotation schedule for both session signature secrets (`CSRF_SECRET`) and asymmetric signature key pairs (`JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`).

### 1. CSRF Session Secret Rotation (`CSRF_SECRET`)

The `CSRF_SECRET` is a symmetric secret key used by Express to generate and validate HMAC-SHA256 signatures for CSRF session validation tokens.

**Rotation Frequency:** Monthly, or immediately upon suspected credential leakage.

#### Step-by-Step Rotation Strategy

1. **Generate a new 64-byte secret key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. **Update the environment variable:**
   - In staging/production environments (e.g., Google Cloud Run, GCP Secret Manager), update `CSRF_SECRET` to the newly generated hex string.
3. **Graceful Transition:**
   - Since CSRF tokens have an expiry window of 1 hour (`CSRF_TOKEN_EXPIRY = 3600`), replacing the secret immediately invalidates all active, unsubmitted client tokens.
   - For zero-downtime rotation, deploy the server using a secret array (if using middleware like `cookie-parser` or `express-session`), or schedule rotation during low-traffic maintenance hours (e.g., post-match teardown).
4. **Deploy and Restart:**
   - Trigger a rolling update of the Cloud Run instances to pick up the new environment configuration.

---

### 2. JWT Signature Key Pair Rotation (`ES256` ECDSA)

Stadium IQ uses asymmetric **ES256 (ECDSA using P-256 and SHA-256)** signatures for JSON Web Token authentication. This requires a Private key for signing and a Public key for verification.

**Rotation Frequency:** Every 90 days, or immediately upon compromise.

#### Step-by-Step Rotation Strategy

1. **Generate a new ECDSA P-256 key pair (PEM format):**
   ```bash
   # Generate private key
   openssl ecparam -name prime256v1 -genkey -noout -out ec-private.pem

   # Extract public key
   openssl ec -in ec-private.pem -pubout -out ec-public.pem
   ```
2. **Retrieve PEM content:**
   - Read the generated `.pem` files and save their contents into GCP Secret Manager.
3. **Configure the Environment:**
   - Bind `JWT_PRIVATE_KEY` to the contents of `ec-private.pem`.
   - Bind `JWT_PUBLIC_KEY` to the contents of `ec-public.pem`.
4. **Deploy:**
   - Restart the Cloud Run service. The application dynamically loads the new key objects during initialization:
     ```javascript
     crypto.createPrivateKey(process.env.JWT_PRIVATE_KEY);
     ```
5. **Session Expiry Warning:**
   - Because tokens are signed with the private key and verified with the public key, rotating keys will invalidate all existing JWTs. Active staff members will be logged out and prompted to log back in. Ensure rotation is done during off-peak operational periods.
