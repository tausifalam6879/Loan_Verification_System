# Feature Documentation

## Authentication and Security

- Users can register and login with JWT authentication.
- Registration no longer exposes an admin role option.
- Backend registration forces public users to `USER`.
- Protected frontend routes prevent unauthenticated dashboard/admin access.
- Admin routes require an admin role.

## User Profile

The profile page shows:

- Name
- Email
- Role
- Total loan applications
- Credit score

Route:

```text
/#/profile
```

## Dashboard

The main dashboard includes:

- Expense summary
- Monthly expense chart
- Transactions/expense list
- Loan marketplace
- Loan applications
- Investment section
- AI assistant
- CSV export
- Theme mode controls

## Loan Marketplace

Users can compare loan offers from multiple banks and loan categories. Seed data includes banks such as SBI, HDFC, ICICI, and Axis.

The comparison view helps users inspect interest rate, amount, tenure, bank, and offer details before applying.

## Loan Application Workflow

Users can submit loan applications with:

- Applicant details
- Income details
- Requested amount
- Credit score
- Aadhaar/PAN/photo document data
- Fraud-risk signal fields

Application statuses are shown through the user dashboard and admin dashboard.

## Admin Dashboard

Admin users can:

- View all applications
- Open a full details modal
- Approve applications
- Reject applications
- View status distribution chart
- View fraud/risk distribution chart
- Monitor low, medium, and high risk applications
- Read activity timeline data
- Review audit logs

## Charts and Analytics

Recharts is used for:

- Approved/rejected/pre-approved loan status analytics
- Fraud-risk distribution
- Monthly expense trends

## Audit Logs

Admin actions are tracked, including:

- Application approval
- Application rejection
- Acting admin identity when available
- Timestamp/action metadata

## OTP Verification

OTP endpoints are implemented:

- `POST /api/users/request-otp`
- `POST /api/users/verify-otp`

OTP behavior is controlled by:

```properties
app.otp.enabled=false
app.otp.console-fallback.enabled=true
```

When `app.otp.enabled=true` and mail is disabled, the backend logs a development OTP in the console. For production email delivery, set `app.mail.enabled=true`, configure SMTP credentials, and disable the console fallback.

## Email Notifications

Email support is optional and disabled by default:

```properties
app.mail.enabled=false
```

When enabled with SMTP, the backend can send notifications for events such as:

- Account-related OTP messages
- Loan approval
- Loan rejection

## Mobile Number Validation

Loan applications validate nominee mobile numbers as Indian 10-digit numbers starting with 6, 7, 8, or 9. The backend accepts common input variants such as `+91 98765 43210` or `09876543210` and stores them as `9876543210`.

## Document Upload

The frontend supports Cloudinary unsigned uploads when configured:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=
REACT_APP_CLOUDINARY_UPLOAD_PRESET=
```

Without Cloudinary settings, the app falls back to base64 document data for local development.

## AI Assistant

The dashboard assistant can help with:

- Loan recommendation
- EMI suggestion
- Expense analysis
- General fintech guidance

## Fraud Monitoring

The app tracks risk fields and displays low, medium, and high risk groupings for admin review. The optional Python FastAPI fraud service can calculate a fraud score from credit score, income, requested amount, identity mismatch, device risk, failed attempts, IP match, and new-device signals.

## Future Production Enhancements

- Connect Spring Boot directly to the FastAPI fraud service before final application save.
- Use real email provider credentials and enforce OTP.
- Use secure Cloudinary signed uploads or backend-mediated uploads.
- Add production deployment configuration.
- Add role-management screens for project owners.
