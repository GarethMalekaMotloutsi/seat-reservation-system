const crypto = require('crypto');
const config = require('./config');
const store = require('./store');
const { addEvent } = require('./events');

const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateHoldCode() {
  let code;

  do {
    code = '';

    for (let i = 0; i < 6; i++) {
      code += characters[crypto.randomInt(characters.length)];
    }
  } while (store.seats.some(seat => seat.holdCode === code));

  return code;
}

function placeHold(email, seatNumber, now = Date.now()) {
  const seat = store.seats.find(seat => seat.number === Number(seatNumber));

  if (!seat) {
    throw new Error('Seat does not exist');
  }

  if (seat.status !== 'available') {
    throw new Error('Seat is not available');
  }

  const activeHolds = store.seats.filter(
    seat => seat.status === 'held' && seat.email === email
  );

  if (activeHolds.length >= config.maxActiveHolds) {
    throw new Error('Maximum active holds reached');
  }

  const oneHourAgo = now - 60 * 60 * 1000;

  const recentHolds = store.holdHistory.filter(
    hold => hold.email === email && hold.createdAt >= oneHourAgo
  );

  if (recentHolds.length >= config.maxHoldsPerHour) {
    throw new Error('Maximum holds per hour reached');
  }

  const holdCode = generateHoldCode();
  const expiresAt = now + config.holdDuration * 1000;

  seat.status = 'held';
  seat.email = email;
  seat.holdCode = holdCode;
  seat.expiresAt = expiresAt;
  seat.extensions = 0;

  store.holdHistory.push({
    email,
    seatNumber: seat.number,
    createdAt: now
  });

  addEvent('hold placed', {
  seatNumber: seat.number,
  email,
  holdCode
});

  return {
    seatNumber: seat.number,
    holdCode,
    expiresAt
  };
}

function expireHolds(now = Date.now()) {
  const expired = [];

  for (const seat of store.seats) {
    if (
      seat.status === 'held' &&
      seat.expiresAt !== null &&
      seat.expiresAt <= now
    ) {
      expired.push({
        seatNumber: seat.number,
        email: seat.email,
        holdCode: seat.holdCode
      });

      seat.status = 'available';
      seat.email = null;
      seat.holdCode = null;
      seat.expiresAt = null;
      seat.extensions = 0;
    }
  }

  for (const hold of expired) {
    addEvent('hold expired', hold);
  }

  return expired;
}

function confirmHold(email, holdCode, now = Date.now()) {
  expireHolds(now);

  const seat = store.seats.find(
    seat => seat.holdCode === holdCode
  );

  if (!seat) {
    throw new Error('Hold code is invalid or has expired');
  }

  if (seat.email !== email) {
    throw new Error('Email does not match the hold');
  }

  if (seat.status === 'confirmed') {
    return {
      seatNumber: seat.number,
      holdCode: seat.holdCode,
      status: seat.status,
    };
  }

  if (seat.status !== 'held') {
    throw new Error('Hold is not active');
  }

  seat.status = 'confirmed';
  seat.expiresAt = null;

  addEvent('hold confirmed', {
    seatNumber: seat.number,
    email: seat.email,
    holdCode: seat.holdCode
  });

  return {
    seatNumber: seat.number,
    holdCode: seat.holdCode,
    status: seat.status
  };
}

function releaseHold(email, holdCode, now = Date.now()) {
  expireHolds(now);

  const seat = store.seats.find(
    seat => seat.holdCode === holdCode
  );

  if (!seat) {
    throw new Error('Hold code is invalid or has expired');
  }

  if (seat.email !== email) {
    throw new Error('Email does not match the hold');
  }

  const seatNumber = seat.number;

  seat.status = 'available';
  seat.email = null;
  seat.holdCode = null;
  seat.expiresAt = null;
  seat.extensions = 0;

  addEvent('hold released', {
    seatNumber,
    email,
    holdCode
  });

  return {
    seatNumber,
    status: 'available'
  };
}

module.exports = {
  generateHoldCode,
  placeHold,
  expireHolds,
  confirmHold,
  releaseHold
};