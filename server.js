// server.js
//─────────────────────────────────────────────
// Express + MySQL booking server
//─────────────────────────────────────────────
const express = require('express');
const cors    = require('cors');
const bp      = require('body-parser');
const mysql   = require('mysql2/promise');
const path    = require('path');
require('dotenv').config();              // optional .env support

const app  = express();
const port = process.env.PORT || 3000;

/* ───────────── MySQL pool ───────────── */
const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'salone_db',
  waitForConnections: true,
  connectionLimit: 10
});

/* ───────────── Middleware ───────────── */
app.use(cors());
app.use(bp.urlencoded({ extended: true }));
app.use(bp.json());

/* ───────────── Static assets ───────────── */
app.use(express.static(path.join(__dirname)));  // serves booking.html, thankyou.html, etc.

/* ───────────── POST /submit_booking ───────────── */
app.post('/submit_booking', async (req, res) => {
  try {
    const { fullName, email, phone, service, date, time, notes } = req.body;
    if (!fullName || !email || !phone || !service || !date || !time) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // look up service_id
    const [[svc]] = await pool.execute(
      'SELECT service_id FROM services WHERE name = ?', [service]
    );
    if (!svc) return res.status(400).json({ status: 'error', message: 'Invalid service' });

    // insert booking
    await pool.execute(
      `INSERT INTO bookings
       (full_name,email,phone,service_id,preferred_date,preferred_time,notes)
       VALUES (?,?,?,?,?,?,?)`,
      [fullName,email,phone,svc.service_id,date,time,notes||null]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/* ───────────── Start ───────────── */
app.listen(port, () => console.log(`➡  http://localhost:${port}`));
