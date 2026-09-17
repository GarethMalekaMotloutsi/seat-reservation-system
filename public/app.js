const seatList = document.getElementById('seat-list');
const selectedSeatInput = document.getElementById('selected-seat');
const holdEmailInput = document.getElementById('hold-email');
const seatMessage = document.getElementById('seat-message');

let selectedSeat = null;

async function getSeats() {
  const response = await fetch('/api/seats');
  const seats = await response.json();

  displaySeats(seats);
}

function displaySeats(seats) {
  seatList.innerHTML = '';

  const availableSeats = seats.filter(
    seat => seat.status === 'available'
  );

  const allTaken = availableSeats.length === 0;

  document.getElementById('waitlist-button').style.display =
    allTaken ? 'inline-block' : 'none';

  for (const seat of seats) {
    const seatElement = document.createElement('div');

    seatElement.className = `seat ${seat.status}`;

    if (selectedSeat === seat.number) {
      seatElement.classList.add('selected');
    }

    let details = `<div class="seat-number">Seat ${seat.number}</div>`;
    details += `<div class="seat-status">${seat.status}</div>`;

    if (seat.email) {
      details += `<div class="seat-email">${seat.email}</div>`;
    }

    if (seat.status === 'held' && seat.expiresAt) {
      const expiry = new Date(seat.expiresAt);

      details += `
        <div class="seat-email">
          Held until ${expiry.toLocaleTimeString()}
        </div>
      `;
    }

    seatElement.innerHTML = details;

    if (seat.status === 'available') {
      seatElement.addEventListener('click', () => {
        selectedSeat = seat.number;
        selectedSeatInput.value = seat.number;
        seatMessage.textContent = `Seat ${seat.number} selected.`;

        displaySeats(seats);
      });
    }

    seatList.appendChild(seatElement);
  }
}

async function placeHold() {
  const email = holdEmailInput.value.trim();

  if (!email || !selectedSeat) {
    seatMessage.textContent = 'Enter your email and select a seat.';
    return;
  }

  const response = await fetch('/api/holds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      seatNumber: selectedSeat
    })
  });

  const data = await response.json();

  if (!response.ok) {
    seatMessage.textContent = data.error;
    return;
  }

  seatMessage.textContent =
    `Hold placed. Your code is ${data.holdCode}`;

  selectedSeat = null;
  selectedSeatInput.value = '';

  getSeats();
}

async function joinWaitlist() {
  const email = holdEmailInput.value.trim();

  if (!email) {
    seatMessage.textContent = 'Enter your email first.';
    return;
  }

  const response = await fetch('/api/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email
    })
  });

  const data = await response.json();

  if (!response.ok) {
    seatMessage.textContent = data.error;
    return;
  }

  seatMessage.textContent =
    'You have been added to the waitlist.';
}

async function manageHold(action) {
  const email = document.getElementById('manage-email').value.trim();
  const holdCode = document.getElementById('manage-code').value.trim();
  const message = document.getElementById('manage-message');

  if (!email || !holdCode) {
    message.textContent = 'Enter your email and hold code.';
    return;
  }

  const response = await fetch(`/api/holds/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      holdCode
    })
  });

  const data = await response.json();

  if (!response.ok) {
    message.textContent = data.error;
    return;
  }

  if (action === 'confirm') {
    message.textContent =
      `Seat ${data.seatNumber} has been confirmed.`;
  }

  if (action === 'extend') {
    const expiry = new Date(data.expiresAt);

    message.textContent =
      `Hold extended until ${expiry.toLocaleTimeString()}.`;
  }

  if (action === 'release') {
    message.textContent =
      `Seat ${data.seatNumber} has been released.`;
  }

  getSeats();
}

async function loadEvents() {
  const seatNumber = document.getElementById('event-seat').value;

  let url = '/api/events';

  if (seatNumber) {
    url += `?seatNumber=${seatNumber}`;
  }

  const response = await fetch(url);
  const events = await response.json();

  const eventList = document.getElementById('event-list');

  eventList.innerHTML = '';

  if (events.length === 0) {
    eventList.innerHTML = '<p>No events found.</p>';
    return;
  }

  for (const event of events) {
    const eventElement = document.createElement('div');

    eventElement.className = 'event';

    let details = `<strong>${event.type}</strong>`;

    if (event.seatNumber) {
      details += ` - Seat ${event.seatNumber}`;
    }

    if (event.email) {
      details += ` - ${event.email}`;
    }

    if (event.holdCode) {
      details += ` - Code: ${event.holdCode}`;
    }

    details += `
      <div class="event-time">
        ${new Date(event.timestamp).toLocaleString()}
      </div>
    `;

    eventElement.innerHTML = details;

    eventList.appendChild(eventElement);
  }
}

document.querySelectorAll('.nav-button').forEach(button => {
  button.addEventListener('click', () => {
    const screen = button.dataset.screen;

    document.querySelectorAll('.nav-button').forEach(navButton => {
      navButton.classList.remove('active');
    });

    document.querySelectorAll('.screen').forEach(section => {
      section.classList.remove('active');
    });

    button.classList.add('active');
    document.getElementById(`${screen}-screen`).classList.add('active');

    if (screen === 'events') {
      loadEvents();
    }
  });
});

document.getElementById('place-hold-button')
  .addEventListener('click', placeHold);

document.getElementById('waitlist-button')
  .addEventListener('click', joinWaitlist);

document.getElementById('confirm-button')
  .addEventListener('click', () => manageHold('confirm'));

document.getElementById('extend-button')
  .addEventListener('click', () => manageHold('extend'));

document.getElementById('release-button')
  .addEventListener('click', () => manageHold('release'));

document.getElementById('event-filter-button')
  .addEventListener('click', loadEvents);

document.getElementById('event-clear-button')
  .addEventListener('click', () => {
    document.getElementById('event-seat').value = '';
    loadEvents();
  });

getSeats();

setInterval(getSeats, 2000);