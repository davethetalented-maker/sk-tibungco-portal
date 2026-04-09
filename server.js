const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

async function loadData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return { requests: [], registrations: [], complaints: [] };
  }
}

async function saveData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10 && digits.startsWith('9')) {
    return '+63' + digits;
  }
  if (digits.length === 11 && digits.startsWith('09')) {
    return '+63' + digits.slice(1);
  }
  if (digits.startsWith('63') && digits.length === 12) {
    return '+' + digits;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return '+63' + digits.slice(1);
  }
  return phone;
}

function makeTrackingNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `TIB-${year}-${suffix}`;
}

function createEmailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_FROM) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(to, subject, html) {
  const transporter = createEmailTransport();
  if (!transporter) {
    console.warn('SMTP not configured; skipping email send to', to);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

async function sendSms(to, message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.warn('Twilio not configured; skipping SMS send to', to);
    return;
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM_NUMBER,
    to: formatPhone(to),
  });
}

function buildDocRequestEmail(request) {
  return `
    <h2>SK Tibungco Document Request Submitted</h2>
    <p>Dear ${request.firstname} ${request.lastname},</p>
    <p>Your request has been received successfully.</p>
    <ul>
      <li><strong>Tracking Number:</strong> ${request.trackingNo}</li>
      <li><strong>Document:</strong> ${request.docType}</li>
      <li><strong>Purpose:</strong> ${request.purpose}</li>
      <li><strong>Status:</strong> ${request.status}</li>
      <li><strong>Pickup Date:</strong> ${request.pickupDate || 'Not specified'}</li>
    </ul>
    <p>We will notify you by email when your document is ready for pickup. If you opted in, you will also receive an SMS update.</p>
    <p>Thank you,<br/>SK Tibungco</p>
  `;
}

function buildStatusUpdateEmail(request) {
  return `
    <h2>SK Tibungco Status Update</h2>
    <p>Dear ${request.firstname} ${request.lastname},</p>
    <p>Your document request <strong>${request.trackingNo}</strong> is now <strong>${request.status}</strong>.</p>
    <p>${request.note || ''}</p>
    <p>If your document is ready for pickup, please bring a valid ID and your tracking number to the barangay hall.</p>
    <p>Thank you,<br/>SK Tibungco</p>
  `;
}

app.post('/api/doc-requests', async (req, res) => {
  const { docType, purpose, firstname, lastname, dob, contactNumber, email, address, pickupDate, smsOptIn } = req.body;
  if (!docType || !purpose || !firstname || !lastname || !email || !contactNumber || !address) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }

  const data = await loadData();
  const request = {
    trackingNo: makeTrackingNumber(),
    docType,
    purpose,
    firstname,
    lastname,
    dob,
    contactNumber,
    email,
    address,
    pickupDate,
    smsOptIn: !!smsOptIn,
    status: 'Received',
    createdAt: new Date().toISOString(),
    history: [
      { status: 'Received', note: 'Request submitted', timestamp: new Date().toISOString() }
    ]
  };

  data.requests.unshift(request);
  await saveData(data);

  await sendEmail(request.email, 'SK Tibungco Document Request Received', buildDocRequestEmail(request)).catch(err => console.error(err));
  if (request.smsOptIn) {
    await sendSms(request.contactNumber, `SK Tibungco: Your request ${request.trackingNo} has been received and is now ${request.status}.`).catch(err => console.error(err));
  }

  res.json({ trackingNo: request.trackingNo, status: request.status });
});

app.post('/api/registrations', async (req, res) => {
  const { firstname, lastname, dob, sex, address, contactNumber, email, education, civilStatus, skills, consent } = req.body;
  if (!firstname || !lastname || !dob || !sex || !address || !contactNumber || !email || !education || !civilStatus || !consent) {
    return res.status(400).json({ error: 'Please complete all required registration fields and accept consent.' });
  }

  const data = await loadData();
  const registration = {
    id: `REG-${Date.now()}`,
    firstname,
    lastname,
    dob,
    sex,
    address,
    contactNumber,
    email,
    education,
    civilStatus,
    skills,
    consent: !!consent,
    createdAt: new Date().toISOString()
  };

  data.registrations.unshift(registration);
  await saveData(data);

  await sendEmail(email, 'SK Tibungco Youth Registration Received', `
    <h2>Youth Registration Received</h2>
    <p>Thank you, ${firstname} ${lastname}.</p>
    <p>We received your youth registration form. We will contact you soon with next steps.</p>
    <p>SK Tibungco</p>
  `).catch(err => console.error(err));

  res.json({ message: 'Registration submitted successfully.' });
});

app.post('/api/complaints', async (req, res) => {
  const { fullname, contact, email, category, incidentDate, details, consent } = req.body;
  if (!category || !details || !consent) {
    return res.status(400).json({ error: 'Please complete the complaint category, details, and consent.' });
  }

  const data = await loadData();
  const complaint = {
    id: `CMP-${Date.now()}`,
    fullname: fullname || 'Anonymous',
    contact,
    email,
    category,
    incidentDate,
    details,
    consent: !!consent,
    createdAt: new Date().toISOString()
  };

  data.complaints.unshift(complaint);
  await saveData(data);

  if (email) {
    await sendEmail(email, 'SK Tibungco Complaint Received', `
      <h2>Complaint Received</h2>
      <p>Thank you for submitting your complaint. We will review it and follow up as needed.</p>
      <p>Reference ID: ${complaint.id}</p>
      <p>SK Tibungco</p>
    `).catch(err => console.error(err));
  }

  res.json({ message: 'Complaint submitted successfully.' });
});

app.get('/api/track/:trackingNo', async (req, res) => {
  const data = await loadData();
  const request = data.requests.find(item => item.trackingNo.toUpperCase() === req.params.trackingNo.toUpperCase());
  if (!request) return res.status(404).json({ error: 'Tracking number not found.' });
  res.json(request);
});

app.get('/api/requests', async (req, res) => {
  const data = await loadData();
  res.json({ requests: data.requests, registrations: data.registrations, complaints: data.complaints });
});

app.patch('/api/requests/:trackingNo/status', async (req, res) => {
  const { status, note } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const data = await loadData();
  const request = data.requests.find(item => item.trackingNo.toUpperCase() === req.params.trackingNo.toUpperCase());
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  request.status = status;
  request.history.push({ status, note: note || '', timestamp: new Date().toISOString() });
  await saveData(data);

  await sendEmail(request.email, 'SK Tibungco Status Update', buildStatusUpdateEmail(request)).catch(err => console.error(err));
  if (request.smsOptIn) {
    await sendSms(request.contactNumber, `SK Tibungco: Request ${request.trackingNo} status changed to ${status}.`).catch(err => console.error(err));
  }

  res.json(request);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'tibungco.html'));
});

app.listen(PORT, () => {
  console.log(`SK Tibungco backend running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});