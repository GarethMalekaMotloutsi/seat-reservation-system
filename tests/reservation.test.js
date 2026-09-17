const test = require('node:test');
const assert = require('node:assert');

const reservation = require('../src/reservation');
const store = require('../src/store');

function resetStore() {
  for (const seat of store.seats) {
    seat.status = 'available';
    seat.email = null;
    seat.holdCode = null;
    seat.expiresAt = null;
    seat.extensions = 0;
  }

  store.waitlist.length = 0;
  store.holdHistory.length = 0;
  store.events.length = 0;
}

test.beforeEach(() => {
  resetStore();
});

test('hold code has 6 valid characters', () => {
  const result = reservation.placeHold('user1@test.com', 1);

  assert.strictEqual(result.holdCode.length, 6);
  assert.match(result.holdCode, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
});

test('hold codes are unique', () => {
  const first = reservation.placeHold('user1@test.com', 1);
  const second = reservation.placeHold('user2@test.com', 2);

  assert.notStrictEqual(first.holdCode, second.holdCode);
});

test('expired hold becomes available', () => {
  reservation.placeHold('user1@test.com', 1, 1000);

  reservation.expireHolds(62000);

  const seat = store.seats.find(seat => seat.number === 1);

  assert.strictEqual(seat.status, 'available');
  assert.strictEqual(seat.email, null);
  assert.strictEqual(seat.holdCode, null);
  assert.strictEqual(seat.expiresAt, null);
});

test('user cannot have more than 2 active holds', () => {
  reservation.placeHold('user1@test.com', 1);
  reservation.placeHold('user1@test.com', 2);

  assert.throws(
    () => reservation.placeHold('user1@test.com', 3),
    /Maximum active holds reached/
  );
});

test('user cannot place more than 5 holds in one hour', () => {
  for (let seat = 1; seat <= 5; seat++) {
    const hold = reservation.placeHold('user1@test.com', seat, 1000);
    reservation.releaseHold('user1@test.com', hold.holdCode, 1000);
  }

  assert.throws(
    () => reservation.placeHold('user1@test.com', 6, 1000),
    /Maximum holds per hour reached/
  );
});

test('confirmation is idempotent', () => {
  const hold = reservation.placeHold('user1@test.com', 1);

  const first = reservation.confirmHold(
    'user1@test.com',
    hold.holdCode
  );

  const second = reservation.confirmHold(
    'user1@test.com',
    hold.holdCode
  );

  assert.deepStrictEqual(second, first);

  const confirmationEvents = store.events.filter(
    event => event.type === 'hold confirmed'
  );

  assert.strictEqual(confirmationEvents.length, 1);
});

test('waitlist user is promoted when a seat becomes available', () => {
  const hold = reservation.placeHold('user1@test.com', 1);

  reservation.joinWaitlist('user2@test.com');

  reservation.releaseHold(
    'user1@test.com',
    hold.holdCode
  );

  const seat = store.seats.find(seat => seat.number === 1);

  assert.strictEqual(seat.status, 'held');
  assert.strictEqual(seat.email, 'user2@test.com');
  assert.ok(seat.holdCode);
  assert.strictEqual(store.waitlist.length, 0);

  const promotionEvent = store.events.find(
    event => event.type === 'waitlist promoted'
  );

  assert.ok(promotionEvent);
});

