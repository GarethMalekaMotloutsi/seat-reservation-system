const store = require('./store');

function addEvent(type, data) {
  store.events.push({
    type,
    timestamp: Date.now(),
    ...data
  });
}

module.exports = {
  addEvent
};