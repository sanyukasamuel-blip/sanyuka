const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const crypto      = require('crypto');      // for reference generator
const nodemailer  = require('nodemailer');  // for e‑mail

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // default in XAMPP
    database: 'test_db' // replace with your DB name
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected...');
});
 

// ─── Mail transporter (example uses Gmail SMTP) ─────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER, // better to keep creds in env vars
    pass: process.env.MAIL_PASS
  }
});

// ─── Helper: generate ref like SAL‑AB12CD34 ─────────────────────
function generateReference() {
  // 8 hex chars → 4 bytes →  ~4 billion combinations
  return 'SAL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// ─── Booking endpoint ───────────────────────────────────────────
app.post('/submit_booking', (req, res) => {
  const { fullName, email, phone, service, date, time, notes } = req.body;

  // 1. Create reference
  const reference = generateReference();

  // 2. Insert into DB
  const sql = `
    INSERT INTO bookings 
      (fullName, email, phone, service, date, time, notes, reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [fullName, email, phone, service, date, time, notes, reference],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server error, please try again.');
      }

      // 3. Send confirmation e‑mail
      const mailOptions = {
        from: '"Salon di Bellezza" <noreply@salon.com>',
        to: email,
        subject: `Your Booking Reference – ${reference}`,
        html: `
          <p>Hi ${fullName.split(' ')[0]},</p>
          <p>Thank you for booking <strong>${service}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p>
          <p>Your reference number is <strong>${reference}</strong>.</p>
          <p>If you need to cancel or reschedule, visit <a href="http://localhost:3000/cancel_booking">Cancel Booking</a> and enter this reference.</p>
          <br>
          <p>We look forward to seeing you!</p>
          <p>— Salon di Bellezza</p>
        `
      };

      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) {
          console.error('E‑mail error:', mailErr);
          // still return success because booking went through
        }

        // 4. Show confirmation page / JSON
        res.send(`
          <h2 style="font-family:Playfair Display,serif;color:#4b2e2e;text-align:center;margin-top:2rem;">
            Booking confirmed!<br>Reference: ${reference}
          </h2>
          <p style="text-align:center;">
            A confirmation e‑mail has been sent to <strong>${email}</strong>.
          </p>
          <div style="text-align:center;">
            <a href="/" class="btn btn-primary">Back to Home</a>
          </div>
        `);
      });
    }
  );
});

// CREATE - Add a new user
app.post('/users', (req, res) => {
    const { name, email } = req.body;
    const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
    db.query(sql, [name, email], (err, result) => {
        if (err) throw err;
        res.send('User added successfully');
    });
});

// READ - Get all users
app.get('/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// UPDATE - Update user by ID
app.put('/users/:id', (req, res) => {
    const { name, email } = req.body;
    const sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
    db.query(sql, [name, email, req.params.id], (err, result) => {
        if (err) throw err;
        res.send('User updated successfully');
    });
});

// DELETE - Delete user by ID
app.delete('/users/:id', (req, res) => {
    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.send('User deleted successfully');
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
