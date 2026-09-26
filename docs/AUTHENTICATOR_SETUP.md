# Authenticator app pilot

No SMS/WhatsApp provider or new dependency is used. Sign in, open Profile, select
Manage authenticator, enter the current account password and create a setup key.
In a compatible TOTP app choose manual setup, enter the key and select time-based
codes (SHA-1, six digits, 30 seconds). Confirm a code in FinTech to enable it.
Do not share or screenshot the setup key. No external QR-generation service is used.

After enabling, password sign-in requires a fresh authenticator code. Existing
verified OTP sign-in channels remain alternatives; this is not mandatory MFA
across every channel and is not phone-number ownership verification. Email OTP
allows a user who has lost a phone to sign in. Profile recovery requires the
current password plus a newly verified email OTP to remove the authenticator.
Without access to the email account or password, no automatic bypass is provided.

Security: 160-bit random secrets, RFC 6238 TOTP, ±one time-step clock tolerance,
single-use accepted steps, five-minute lockout after five failed codes, ten-minute
pending enrollment. Database row locks serialize verification per account. Secrets
are AES-256-GCM encrypted and account-bound. The encryption key is derived using
HMAC-SHA256 with a purpose-specific label from the existing JWT secret. Keep that
secret stable and backed up securely; rotating it requires authenticator recovery
and re-enrollment. Never log secrets or put them in URLs/localStorage.

Deployment adds only `authenticator_credentials` via the existing Hibernate schema
update mechanism. No existing account is enrolled automatically. The backend must
be deployed before setup is usable. Existing password/email sign-in must be checked
after deployment. Test enrollment with a dedicated non-production account, not by
automatically changing a real user's authentication settings.

Codes generate offline on the phone; FinTech still needs internet for server login.
Pilot limitations: manual setup key (no QR), no recovery-code list, no enforced MFA
on alternative OTP channels, and existing password/OTP abuse protections remain
separate from the authenticator's code-attempt lockout.
