# Setup Guide

This guide explains how to run the Loan Verification System locally.

## Prerequisites

- Java 21 or newer
- Maven Wrapper included in the repository
- Node.js and npm
- MySQL Server
- Python 3.10+ for the optional fraud service

## Backend Setup

1. Create the database:

```sql
CREATE DATABASE loan_db;
```

2. Check database credentials in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/loan_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root123
server.port=8081
```

3. Run the backend:

```powershell
.\mvnw.cmd spring-boot:run
```

4. Verify:

```text
http://localhost:8081/api/users/test
```

Expected response:

```text
Congratulations! Loan Verification System Backend is Running Perfectly!
```

## Frontend Setup

1. Install dependencies:

```powershell
cd frontend
npm install
```

2. Run the React app:

```powershell
npm start
```

3. Open:

```text
http://localhost:3000
```

The app uses hash routes such as `/#/login`, `/#/profile`, and `/#/admin`.

## Optional AI Fraud Service

The Python FastAPI service is separate from the Spring Boot backend.

```powershell
cd ai-fraud-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open:

```text
http://localhost:8000/health
```

## Optional Email and OTP Setup

OTP endpoints exist, but OTP enforcement is disabled by default for local demos.

Enable email and OTP only after SMTP credentials are ready:

```powershell
$env:APP_OTP_ENABLED="true"
$env:APP_MAIL_ENABLED="true"
$env:SMTP_HOST="smtp.gmail.com"
$env:SMTP_PORT="587"
$env:SMTP_USERNAME="your-email@gmail.com"
$env:SMTP_PASSWORD="your-gmail-app-password"
```

For Gmail, use an app password instead of your normal account password.

See [Email OTP Setup](EMAIL_OTP.md) for full steps.

## Optional Cloudinary Setup

Create `frontend/.env` from `frontend/.env.example`:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
```

Restart the frontend after changing `.env`.

## Build and Test

Backend:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

Frontend:

```powershell
cd frontend
npm test -- --watchAll=false
npm run build
```

## Troubleshooting

### IntelliJ shows `package org.springframework.mail does not exist`

Reload the Maven project from IntelliJ's Maven panel. The service is also written so email support stays optional when SMTP is disabled.

### `mvn package` fails because JAR cannot be renamed

A running backend may be locking `target/VerificationSystem-0.0.1-SNAPSHOT.jar`. Stop the running backend process, then run:

```powershell
.\mvnw.cmd package
```

### Frontend cannot call backend

Confirm backend is running on port `8081` and frontend API services point to `http://localhost:8081`.

### MySQL connection fails

Check that MySQL is running, the `loan_db` database exists, and the username/password in `application.properties` match your local machine.
