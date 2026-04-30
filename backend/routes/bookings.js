const express = require('express');
const router  = express.Router();
const db      = require('salone_db');   // your existing MySQL pool / connection

// ───────── 1. Serve the cancel page (if you're not using a static folder) ─────────
router.get('/cancel_booking', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cancel_booking.html'));
});

// ───────── 2. Handle the form POST ─────────
router.post('/cancel_booking', (req, res) => {
  const { bookingId, email } = req.body;

  // Safeguard: both fields must be present
  if (!bookingId || !email) {
    return res.status(400).send('Missing booking reference or email.');
  }

  // OPTION A — mark as CANCELLED
  const sql = `
    UPDATE bookings
    SET status = 'CANCELLED'
    WHERE id = ? AND email = ? AND status = 'CONFIRMED'
  `;

  // OPTION B — completely delete the record
  // const sql = 'DELETE FROM bookings WHERE id = ? AND email = ?';

  db.query(sql, [bookingId, email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error; please try again.');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('No matching booking found or it is already cancelled.');
    }

    // All good!
    res.send(`
      <h2 style="font-family:Playfair Display,serif;color:#4b2e2e;">
        Booking ${bookingId} has been cancelled.
      </h2>
      <a href="/" style="text-decoration:none;color:#7c3e3e;">Back to Home</a>
    `);
  });
});

module.exports = router;
