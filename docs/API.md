# API Reference

Base backend URL:

```text
http://localhost:8081
```

Most protected endpoints require:

```http
Authorization: Bearer <jwt-token>
```

## User and Auth

### Test Backend

```http
GET /api/users/test
```

Returns a simple backend health message.

### Register User

```http
POST /api/users/register
Content-Type: application/json
```

Creates a new user account. Public registration is forced to the `USER` role.

Example body:

```json
{
  "name": "Demo User",
  "email": "demo@example.com",
  "password": "password123"
}
```

### Login

```http
POST /api/users/login
Content-Type: application/json
```

Returns user details and a JWT token.

Example body:

```json
{
  "email": "demo@example.com",
  "password": "password123"
}
```

### Request OTP

```http
POST /api/users/request-otp
Content-Type: application/json
```

Requests an OTP for the given email. OTP is optional and controlled by `app.otp.enabled`.

### Verify OTP

```http
POST /api/users/verify-otp
Content-Type: application/json
```

Verifies an OTP for the given email.

### Auth Config

```http
GET /api/users/auth-config
```

Returns whether email OTP is enabled for the current backend environment.

Example response:

```json
{
  "otpEnabled": false
}
```

### Current User Profile

```http
GET /api/users/me
Authorization: Bearer <jwt-token>
```

Returns current user's name, email, role, application count, and credit score.

## Expenses

### Add Expense

```http
POST /api/expenses/add
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Get Expenses

```http
GET /api/expenses/all
Authorization: Bearer <jwt-token>
```

### Delete Expense

```http
DELETE /api/expenses/delete/{id}
Authorization: Bearer <jwt-token>
```

## Loans

### Get Loan Offers

```http
GET /api/loans/offers
Authorization: Bearer <jwt-token>
```

Returns loan offers seeded for multiple banks and loan types.

### Get Loan Offer By ID

```http
GET /api/loans/offers/{id}
Authorization: Bearer <jwt-token>
```

### Submit Loan Application

```http
POST /api/loans/apply
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

Creates a loan application with applicant, income, document, and risk details.

### All Applications

```http
GET /api/loans/applications
Authorization: Bearer <jwt-token>
```

Returns all loan applications.

### My Applications

```http
GET /api/loans/my-applications
Authorization: Bearer <jwt-token>
```

Returns applications belonging to the logged-in user.

### Mark Processing Fee Paid

```http
POST /api/loans/applications/{id}/payment
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

Marks the processing fee/payment step for an application.

## Admin

Admin endpoints require an admin JWT.

### Users

```http
GET /api/admin/users
Authorization: Bearer <admin-jwt-token>
```

### Applications

```http
GET /api/admin/applications
Authorization: Bearer <admin-jwt-token>
```

### Approve Application

```http
PUT /api/admin/applications/{id}/approve
Authorization: Bearer <admin-jwt-token>
```

Approves an application, writes an audit log, and sends email if email is enabled.

### Reject Application

```http
PUT /api/admin/applications/{id}/reject
Authorization: Bearer <admin-jwt-token>
```

Rejects an application, writes an audit log, and sends email if email is enabled.

### Dashboard Stats

```http
GET /api/admin/dashboard
Authorization: Bearer <admin-jwt-token>
```

Returns totals and status/risk counts for dashboard charts.

### Audit Logs

```http
GET /api/admin/audit-logs
Authorization: Bearer <admin-jwt-token>
```

Returns tracked admin actions.

## Optional Fraud Service

Base URL:

```text
http://localhost:8000
```

### Health

```http
GET /health
```

### Fraud Score

```http
POST /fraud-score
Content-Type: application/json
```

Example body:

```json
{
  "applicant_name": "Demo User",
  "credit_score": 650,
  "monthly_income": 50000,
  "requested_amount": 600000,
  "failed_attempts": 0,
  "identity_mismatch": false,
  "device_risk": "low",
  "ip_country_matches_kyc": true,
  "new_device": false
}
```

Example response:

```json
{
  "risk_score": 10,
  "risk_level": "LOW",
  "decision": "ALLOW_STANDARD_LOAN_WORKFLOW",
  "reasons": ["No major fraud signals detected."]
}
```
