const express = require('express');
const store = require('./store');

const {
  expireHolds,
  placeHold,
  confirmHold,
  releaseHold,
  extendHold,
  joinWaitlist
} = require('./reservation');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/seats', (req, res) => {
  expireHolds();

  res.json(store.seats);
});

app.post('/api/holds', (req, res) => {
  const { email, seatNumber } = req.body;

  if (!email || !seatNumber) {
    return res.status(400).json({
      error: 'Email and seat number are required'
    });
  }

  try {
    const result = placeHold(email, seatNumber);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.post('/api/holds/confirm', (req, res) => {
  const { email, holdCode } = req.body;

  if (!email || !holdCode) {
    return res.status(400).json({
      error: 'Email and hold code are required'
    });
  }

  try {
    const result = confirmHold(email, holdCode);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.post('/api/holds/release', (req, res) => {
  const { email, holdCode } = req.body;

  if (!email || !holdCode) {
    return res.status(400).json({
      error: 'Email and hold code are required'
    });
  }

  try {
    const result = releaseHold(email, holdCode);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.post('/api/holds/extend', (req, res) => {
  const { email, holdCode } = req.body;

  if (!email || !holdCode) {
    return res.status(400).json({
      error: 'Email and hold code are required'
    });
  }

  try {
    const result = extendHold(email, holdCode);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email is required'
    });
  }

  try {
    const result = joinWaitlist(email);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.get('/api/events', (req, res) => {
  expireHolds();

  const seatNumber = req.query.seatNumber;

  if (!seatNumber) {
    return res.json(store.events);
  }

  const events = store.events.filter(
    event => event.seatNumber === Number(seatNumber)
  );

  res.json(events);
});

setInterval(() => {
  expireHolds();
}, 2000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});