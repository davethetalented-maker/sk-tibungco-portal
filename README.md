# SK Tibungco Portal

A digital governance portal for Sangguniang Kabataan of Barangay Tibungco.

## Features
- Document request submission with tracking
- Youth sector registration
- Complaint filing
- Email and SMS notifications
- Admin dashboard for status updates

## Local Development
1. Install Node.js
2. Run `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run `npm start`
5. Open http://localhost:3000

## Deployment
Deployed on Render.com: [Your Render URL]

## Environment Variables
- SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM for email
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER for SMS