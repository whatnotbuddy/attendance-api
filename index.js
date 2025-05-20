require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.enable('trust proxy');
app.use((req, res, next) => {
  if (req.secure) return next();
  res.redirect(`https://${req.headers.host}${req.url}`);
});

// Google Sheets setup
const keyFilePath = '/etc/secrets/credentials.json';
const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;

// Routes
app.get('/', (req, res) => res.send('Hello World'));

app.post('/mark-attendance', async (req, res) => {
  try {
    const { name, email, status, location, remarks } = req.body;

    // Format timestamp in IST
    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'short',
      timeStyle: 'medium',
    });
    const timestamp = istFormatter.format(new Date());

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[timestamp, name, email, status, location, remarks]] },
    });

    res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


// ✅ Use Render-assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
