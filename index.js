require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // name of the file you downloaded
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;

// Test route to verify server is running
app.get('/', (req, res) => {
  res.send('Hello World');
});


app.post('/mark-attendance', async (req, res) => {
  try {
    const { name, email, status, remarks } = req.body;
    const timestamp = new Date().toISOString();

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[timestamp, name, email, status, remarks]],
      },
    });

    res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(5050, () => {
  console.log('Server started on http://localhost:5050');
});
