const config = require('./config');

const seats = [];

for (let i = 1; i <= config.seats; i++) {
  seats.push({
    number: i,
    status: 'available',
    email: null,
    holdCode: null,
    expiresAt: null,
    extensions: 0
  });
}

const store = {
  seats,
  waitlist: [],
  holdHistory: [],
  events: []
};

module.exports = store;