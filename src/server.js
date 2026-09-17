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
app.use(express.json());
app.use(express.static('public'));

function sendError(res, message, status = 400) {
  res.status(status).json({
    error: message
  });
}

app.get('/api/seats', (req, res) => {
  expireHolds();

  res.json(store.seats);
});

app.post('/api/holds', (req, res) => {
  const { email, seatNumber } = req.body;

  if (!email || !seatNumber) {
    return sendError(
      res,
      'Email and seat number are required'
    );
  }

  try {
    const result = placeHold(email, seatNumber);

    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Seat does not exist') {
      return sendError(res, error.message, 404);
    }

    if (error.message === 'Seat is not available') {
      return sendError(res, error.message, 409);
    }

    sendError(res, error.message);
  }
});

app.post('/api/holds/confirm', (req, res) => {
  const { email, holdCode } = req.body;

  if (!email || !holdCode) {
    return sendError(
      res,
      'Email and hold code are required'
    );
  }

  try {
    const result = confirmHold(email, holdCode);

    res.json(result);
  } catch (error) {
    if (error.message === 'Hold code is invalid or has expired') {
      return sendError(res, error.message, 404);
    }

    if (error.message === 'Email does not match the hold') {
      return sendError(res, error.message, 403);
    }

    sendError(res, error.message);
  }
});

app.post('/api/holds/release', (req, res) => {
  const { email, holdCode } = req.body;

  if (!email || !holdCode) {
    return sendError(
      res,
      'Email and hold code are required'
    );
  }

  try {
    const result = releaseHold(email, holdCode);

    res.json(result);
  } catch (error) {
    if (error.message === 'Hold code is invalid or has expired') {
      return sendError(res, error.message, 404);
    }

    if (error.message === 'Email does not match the hold') {
      return sendError(res, error.message, 403);
    }

    sendError(res, error.message);
  }
});

app.post('/api/holds/extend', (req, res) => {
  const { email, holdCode } = req.body;

  if (!email || !holdCode) {
    return sendError(
      res,
      'Email and hold code are required'
    );
  }

  try {
    const result = extendHold(email, holdCode);

    res.json(result);
  } catch (error) {
    if (error.message === 'Hold code is invalid or has expired') {
      return sendError(res, error.message, 404);
    }

    if (error.message === 'Email does not match the hold') {
      return sendError(res, error.message, 403);
    }

    sendError(res, error.message);
  }
});

app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 'Email is required');
  }

  try {
    const result = joinWaitlist(email);

    res.status(201).json(result);
  } catch (error) {
    if (
      error.message ===
      'Waitlist is only available when all seats are taken'
    ) {
      return sendError(res, error.message, 409);
    }

    if (
      error.message === 'User already has a reservation' ||
      error.message === 'User is already on the waitlist'
    ) {
      return sendError(res, error.message, 409);
    }

    sendError(res, error.message);
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